// import package
import axios from "axios";
import https from "https";
import converter from "hex2dec";
import querystring from "querystring";
import Web3 from "web3";
import mongoose from "mongoose";

// import modal
import Currency from "../../models/currency";
import User from "../../models/User";
import Assets from "../../models/Assets";
import Transaction from "../../models/Transaction";

// import controller
import { mailTemplateLang } from "../emailTemplate.controller";

import { Referralcommission } from "../referralcommission.controller";

// import config
import config from "../../config";

// import lib
import isEmpty from "../../lib/isEmpty";
import isJsonParse from "../../lib/isJsonParse";
import { encryptString, decryptString } from "../../lib/cryptoJS";

import { getLatestBlock, getNewAddress, amountMoveToAdmin, tokenMoveToAdmin, ethMoveToUser, tokenWithdraw } from "../../coinfiles/eth";

const web3 = new Web3(config.coinGateway.eth.url);
const ObjectId = mongoose.Types.ObjectId;

export const createAddress = async () => {
  try {
    let { status, data } = await getNewAddress();
    if (status) {
      let { address, privateKey } = data;
      return { address, privateKey };
    } else {
      return { address: "", privateKey: "" };
    }
  } catch (err) {
    console.log("createAddress",err);
    return { address: "", privateKey: "" };
  }
};

/**
 * Deposit ETH
 */
export const deposit = async (userId) => {
  try {
    console.log("*************** deposit eth");

    let getUsers = await User.aggregate([
      { $match: { _id: ObjectId(userId) } },
      {
        $lookup: {
          from: "Assets",
          localField: "_id",
          foreignField: "userId",
          as: "userAssetsInfo",
        },
      },
      {
        $unwind: "$userAssetsInfo",
      },
      { $match: { "userAssetsInfo.currencySymbol": "ETH" } },
      {
        $project: {
          _id: 1,
          email: 1,
          blockNo: "$userAssetsInfo.blockNo",
          userAssetId: "$userAssetsInfo._id",
          userId: "$userAssetsInfo.userId",
          currencySymbol: "$userAssetsInfo.currencySymbol",
          currencyAddress: "$userAssetsInfo.currencyAddress",
          privateKey: "$userAssetsInfo.privateKey",
          currencyId: "$userAssetsInfo.currency",
        },
      },
    ]);

    let latestBlockNumber = await getLatestBlock();
    for (let x in getUsers) {
      var user = getUsers[x];
      let startBlock = user.blockNo;
      let depositUrl = config.coinGateway.eth.ethDepositUrl.replace("##USER_ADDRESS##", user.currencyAddress).replace("##START_BLOCK##", startBlock).replace("##END_BLOCK##", latestBlockNumber);

      let respData = await axios({ url: depositUrl, method: "post" });
      
      if (respData && respData.data && respData.data.status == "1") {
        for (let y in respData.data.result) {
          let result = respData.data.result[y];
          let userAssetData = await Assets.findOne({
            currencyAddress: {
              $regex: new RegExp(".*" + result.to.toLowerCase() + ".*", "i"),
            },
            currencySymbol: user.currencySymbol,
          });
          if (userAssetData) {
            let transactionExist = await Transaction.exists({ txid: result.hash });
            let responseData = await amountMoveToAdmin(decryptString(userAssetData.privateKey),userAssetData.currencyAddress);
            if (!transactionExist) {
              let transaction = new Transaction({
                userId: userAssetData.userId,
                currencyId: user.currencyId,
                fromaddress: result.from,
                toaddress: result.to,
                txid: result.hash,
                currencySymbol: userAssetData.currencySymbol,
                paymentType: "coin_deposit",
                amount: result.value / 1000000000000000000,
                status: "completed",
              });
              let newTransaction = await transaction.save();
              userAssetData.spotwallet = userAssetData.spotwallet + result.value / 1000000000000000000;
              userAssetData.blockNo = latestBlockNumber;
              await userAssetData.save();

              let content = {
                email: user.email,
                currencySymbol: "ETH",
                amount: result.value / 1000000000000000000,
                txid: result.hash,
                date: new Date(),
              };

              mailTemplateLang({
                userId: userAssetData.userId,
                identifier: "User_deposit",
                toEmail: user.email,
                content,
              });

              let amount = result.value / 1000000000000000000;

              Referralcommission("ETH", amount, userAssetData.userId);
            }
          }
        }
      }
    }
    return;
  } catch (err) {
    console.log("Error on  ethGateway(deposit)", err);
    return;
  }
};

/**
 * Deposit ERC20_TOEKEN
 */
export const ERC20_Deposit = async (userId, currencySymbol) => {
  try {
    let getUsers = await User.aggregate([
      { $match: { _id: ObjectId(userId) } },
      {
        $lookup: {
          from: "Assets",
          localField: "_id",
          foreignField: "userId",
          as: "userAssetsInfo",
        },
      },
      {
        $unwind: "$userAssetsInfo",
      },
      { $match: { "userAssetsInfo.currencySymbol": currencySymbol } },
      {
        $lookup: {
          from: "currency",
          localField: "userAssetsInfo.currency",
          foreignField: "_id",
          as: "currencyInfo",
        },
      },
      {
        $unwind: "$currencyInfo",
      },
      {
        $project: {
          _id: 1,
          te1Block: 1,
          userAssetId: "$userAssetsInfo.userId",
          currencySymbol: "$userAssetsInfo.currencySymbol",
          currencyAddress: "$userAssetsInfo.currencyAddress",
          privateKey: "$userAssetsInfo.privateKey",
          currencyId: "$userAssetsInfo.currency",
          contractAddress: "$currencyInfo.contractAddress",
          minABI: "$currencyInfo.minABI",
          decimals: "$currencyInfo.decimals",
        },
      },
    ]);

    let latestBlockNumber = await getLatestBlock();

    for (let x in getUsers) {
      var user = getUsers[x];

      let startBlock = user.blockNo;
      let depositUrl = config.coinGateway.eth.ethTokenDepositUrl.replace("##CONTRACT_ADDRESS##",user.contractAddress).replace("##USER_ADDRESS##",user.currencyAddress).replace("##START_BLOCK##", startBlock).replace("##END_BLOCK##",latestBlockNumber);

      let respData = await axios({ url: depositUrl, method: "post" });
      if (respData && respData.data && respData.data.status == "1") {
        for (let y in respData.data.result) {
          let result = respData.data.result[y];

          let userAssetData = await Assets.findOne({
            currencyAddress: {
              $regex: new RegExp(".*" + result.to.toLowerCase() + ".*", "i"),
            },
            currencySymbol: currencySymbol,
          });

          if (userAssetData) {
            let transactionExist = await Transaction.exists({ txid: result.hash });

            if (!transactionExist) {
              let responseData = await tokenMoveToAdmin(decryptString(userAssetData.privateKey),userAssetData.currencyAddress,user.contractAddress,user.minABI,user.decimals);

              if (responseData && responseData.status) {

                let amount = parseFloat(result.value) / 10 ** parseFloat(result.tokenDecimal);

                let transaction = new Transaction({
                  userId: userAssetData.userId,
                  currencyId: user.currencyId,
                  fromaddress: result.from,
                  toaddress: result.to,
                  txid: result.hash,
                  currencySymbol: userAssetData.currencySymbol,
                  paymentType: "coin_deposit",
                  amount: parseFloat(result.value) / 10 ** parseFloat(result.tokenDecimal),
                  status: "completed",
                });
                let newTransaction = await transaction.save();
                userAssetData.spotwallet = userAssetData.spotwallet + amount;
                userAssetData.blockNo = latestBlockNumber;
                await userAssetData.save();

                let content = {
                  email: user.email,
                  currencySymbol: userAssetData.currencySymbol,
                  amount,
                  txid: result.hash,
                  date: new Date(),
                };

                mailTemplateLang({
                  userId: userAssetData.userId,
                  identifier: "User_deposit",
                  toEmail: user.email,
                  content,
                });
                Referralcommission(
                  userAssetData.currencySymbol,
                  amount,
                  userAssetData.userId
                );
              }
            }
          }
        }
      }
    }
    return;
  } catch (err) {
    console.log("Error on  ethGateway(deposit)", err);
    return;
  }
};

export const amountMoveToUser = async (data) => {
  try {
    let { privateKey, fromAddress, toAddress, amount } = data;
    let respData = await ethMoveToUser(privateKey, fromAddress, toAddress, amount);
    if (respData && respData.status) {
      return {
        status: true,
        data: respData.data,
      };
    } else {
      return {
        status: false,
        message: "Some error",
      };
    }
  } catch (err) {
    return {
      status: false,
      message: "Something went wrong, please try again.",
    };
  }
};

export const tokenMoveToUser = async (data) => {
  try {
    let { privateKey, fromAddress, toAddress, contractAddress, minAbi, decimals, amount } = data;
    let respData = await tokenWithdraw(privateKey, fromAddress, toAddress, contractAddress, minAbi, decimals, amount);
    if (respData && respData.status) {
      return {
        status: true,
        data: respData.data,
      };
    } else {
      return {
        status: false,
        message: "Some error",
      };
    }
  } catch (err) {
    return {
      status: false,
      message: "Something went wrong, please try again.",
    };
  }
};
