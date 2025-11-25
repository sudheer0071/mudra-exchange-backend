// import package
import axios from "axios";
import Web3 from "web3";
import Common from "@ethereumjs/common";
import mongoose from "mongoose";

// import controller
import { createPassBook } from "../passbook.controller";
import { hincbyfloat } from "../redis.controller";
import { bnbServSign } from '../../config/jwt'
import { mailTemplateLang } from "../emailTemplate.controller";
import { newNotification } from "../notification.controller";
import { Referralcommission } from "../referralcommission.controller";
// import modal
import {
  Transaction,
  Currency,
  User,
  Assets,
  DepositHash,
} from "../../models";
import { IncCntObjId } from '../../lib/generalFun';
// import config
import config from "../../config/index";

// import lib
import { toFixedNoRound } from "../../lib/roundOf";
import isEmpty from "../../lib/isEmpty";

const web3 = new Web3(config.coinGateway.bnb.serverURL);
const ObjectId = mongoose.Types.ObjectId;

export const createAddress = async () => {
  try {
    let auth = bnbServSign({
      id: config?.coinGateway.bnb.id,
    });
    if (!auth.status) {
      return false;
    }
    let respData = await axios({
      method: "get",
      timeout: 1000,
      url: `${config.coinGateway.bnb.serverURL}/getnewaddress`,
      headers: {
        Authorization: auth.token,
        "Accept-Encoding": "gzip,deflate,compress",
      },
    });
    if (respData && respData.status == 200 && !isEmpty(respData.data.data)) {
      const { address, privateKey } = respData.data.data;
      return {
        address,
        privateKey,
      };
    } else {
      return {
        address: "",
        privateKey: "",
      };
    }
  } catch (err) {
    console.log('err: ', err, "err");
    return {
      address: "",
      privateKey: "",
    };
  }
};
export const amountMoveToAdmin = async (data) => {
  try {
    console.log("<<< --- BNB MOVE TO ADMIN FUNCTION CALL --- >>>", data);
    let auth = bnbServSign({
      id: config.coinGateway.bnb.id,
    });

    console.log("auth.////////////////////////// ", auth)

    if (!auth.status) {
      return false;
    }
    let respData = await axios({
      method: "post",
      url: `${config.coinGateway.bnb.serverURL}/bnb-move-admin`,
      headers: {
        Authorization: auth.token,
        "Accept-Encoding": "gzip,deflate,compress",
      },
      data,
    });
    console.log(respData.data, "<<< --- RESPDATA --- >>>");
    if (respData && respData.data) {
      return {
        status: true,
        txHash: respData?.data?.txHash?.transactionHash,
      };
    } else {
      return {
        status: false,
      };
    }
  } catch (err) {
    console.log(err, "err");
    return {
      status: false,
      message: "Error on Server",
    };
  }
};
export const tokenMoveToAdmin = async (data) => {
  try {
    console.log('data: ', data);
    console.log("<<< --- BEP20 MOVE TO ADMIN FUNCTION --- >>>");
    let auth = bnbServSign({
      id: config.coinGateway.bnb.id,
    });
    if (!auth.status) {
      return false;
    }
    let respData = await axios({
      method: "post",
      url: `${config.coinGateway.bnb.serverURL}/bep20-token-move-admin`,
      headers: {
        Authorization: auth.token,
        "Accept-Encoding": "gzip,deflate,compress",
      },
      data,
    });
    console.log(
      respData.data,
      "---------------------------BEP20 RESPDATA-----------------------------"
    );
    if (respData && respData.data && respData.data.status == true) {
      return {
        status: true,
      };
    } else if (
      respData &&
      respData.data &&
      respData.data.status == false &&
      respData.data.TYPE == "NO_BALANCE"
    ) {
      return {
        status: false,
        type: "NO_BALANCE",
      };
    }
    return {
      status: false,
    };
  } catch (err) {
    // console.log(err, "---respData.data.status");
    return {
      status: false,
      message: "Error on Server",
    };
  }
};

// usrAddress, amount - POST
export const amountMoveToUser = async (data) => {
  try {
    let auth = bnbServSign({
      id: config.coinGateway.bnb.id,
    });
    if (!auth.status) {
      return false;
    }
    let respData = await axios({
      method: "post",
      url: `${config.coinGateway.bnb.serverURL}/bnb-move-user`,
      headers: {
        Authorization: auth.token,
        "Accept-Encoding": "gzip,deflate,compress",
      },
      data,
    });
    if (respData && respData.status == 200) {
      return {
        status: true,
        data: respData.data.data,
        message: respData.data.message
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
      message: err.response.data.message,
    };
  }
};
export const tokenMoveToUser = async (data) => {
  try {
    let auth = bnbServSign({
      id: config.coinGateway.bnb.id,
    });
    if (!auth.status) {
      return false;
    }
    let respData = await axios({
      method: "post",
      url: `${config.coinGateway.bnb.serverURL}/bep20-token-move-user`,
      headers: {
        Authorization: auth.token,
        "Accept-Encoding": "gzip,deflate,compress",
      },
      data,
    });
    if (respData && respData.status == 200) {
      console.log("trxIdtrxIdtrxIdtrxIdtrxId", respData.data.data);
      return {
        status: true,
        data: respData.data.data,
        trxId: respData.data.data.transactionHash,
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
      message: err.response?.data?.message,
    };
  }
};
export function convert(n) {
  try {
    var sign = +n < 0 ? "-" : "",
      toStr = n.toString();
    if (!/e/i.test(toStr)) {
      return n;
    }
    var [lead, decimal, pow] = n.toString()
      .replace(/^-/, "")
      .replace(/^([0-9]+)(e.*)/, "$1.$2")
      .split(/e|\./);
    return +pow < 0
      ? sign + "0." + "0".repeat(Math.max(Math.abs(pow) - 1 || 0, 0)) + lead + decimal
      : sign + lead + (+pow >= decimal.length ? (decimal + "0".repeat(Math.max(+pow - decimal.length || 0, 0))) : (decimal.slice(0, +pow) + "." + decimal.slice(+pow)))
  } catch (err) {
    return 0;
  }
}



export const isAddress = (address) => {
  try {
    if (isEmpty(address)) {
      return false;
    }

    return web3.utils.isAddress(address);
  } catch (err) {
    return false;
  }
};


export const DepositWebhook = async (req, res) => {
  try {
    let reqBody = req.body;
    console.log("---------------reqBody DepositWebhook", reqBody);
    if (reqBody.from == config.coinGateway.bnb.address.toLowerCase()) {
      console.log(reqBody.from == config.coinGateway.bnb.address.toLowerCase(), "admin and deposit address is same", reqBody);

      return res
        .status(200)
        .json({ success: true, message: "Something went wrong" });
    }

    let currencyDoc = await Currency.findOne({
      currencySymbol: reqBody.coin,
      status: 'active',
      $or: [{ type: "crypto" }, { gateWay: "BEB" }],
    }).lean();
    if (!currencyDoc) {
      return res
        .status(500)
        .json({ success: false, message: "Currency Not Found!!" });
    }

    let usrWallet,
      amount = 0, assetId;

    console.log("----currencyDoc", currencyDoc)

    usrWallet = await Assets.findOne({
      currencyAddress: { $regex: reqBody.address, $options: "i" },
    });
    if (!usrWallet) {
      return res
        .status(500)
        .json({ success: false, message: "User Wallet not fount!" });
    }

    if (currencyDoc.type == "crypto")
      amount = parseInt(reqBody.amount, 10) / 10 ** 18;
    if (currencyDoc.type == "token")
      amount = reqBody.amount / 10 ** parseInt(currencyDoc.decimals);

    let depositAmount = amount

    if (currencyDoc.type == "token" && currencyDoc.burnFee > 0) amount = withServiceFee(parseFloat(amount), currencyDoc.burnFee)
    assetId = currencyDoc._id


    let checkTx = await Transaction.findOne({ txid: reqBody.txId }).lean()
    if (!checkTx) {
      await DepositHash.findOneAndUpdate(
        { hash: reqBody.txId },
        {
          userId: usrWallet.userId,
          currencyId: currencyDoc._id,
          coin: currencyDoc.currencySymbol,
          userAddress: reqBody.address,
          fromAddress: reqBody.from,
          amount: parseFloat(depositAmount),
          network: "BNB",
          assetEntry: amount >= currencyDoc.minimumDeposit,
        },
        {
          upsert: true,
        }
      );
    }
    if (amount >= currencyDoc.minimumDeposit) {

      let insertTrx = await Transaction.findOneAndUpdate(
        {
          txid: reqBody.txId,
        },
        {
          userId: usrWallet.userId,
          currencySymbol: currencyDoc.currencySymbol,
          currencyId: currencyDoc._id,
          txid: reqBody.txId,
          toaddress: reqBody.address,
          fromaddress: reqBody.from,
          amount: amount,
          paymentType: "coin_deposit",
          status: "completed",
          userCode: IncCntObjId(usrWallet._id),
          burnFee: currencyDoc.burnFee
        },
        { upsert: true }
      );
      if (!insertTrx) {
        let trxData = await Transaction.findOne({ txid: reqBody.txId }).populate("userId");
        if (trxData) {

          usrWallet.spotwallet = usrWallet.spotwallet + parseFloat(amount);
          await usrWallet.save();
          // CREATE PASS_BOOK
          createPassBook({
            userId: usrWallet.userId,
            coin: currencyDoc.currencySymbol,
            currencyId: currencyDoc._id,
            tableId: trxData._id,
            beforeBalance: parseFloat(usrWallet.spotwallet - amount),
            afterBalance: parseFloat(usrWallet.spotwallet),
            amount: parseFloat(amount),
            type: "coin_deposit",
            category: "credit",
          });

          let doc = {
            userId: usrWallet.userId.toString(),
            type: "Deposit",
            description: `${amount} ${currencyDoc.currencySymbol}${currencyDoc.type == 'token' ? '(BEP20)' : ''} - Deposited successfully`,
          };
          newNotification(doc);

          if (trxData?.userId?.email) {
            let content = {
              email: trxData.userId.email,
              currency: currencyDoc.type == 'token' ? currencyDoc.currencySymbol + '(BEP20)' : currencyDoc.currencySymbol,
              amount: parseFloat(amount),
              transactionId: reqBody.txId,
              date: new Date(),
            };

            mailTemplateLang({
              userId: usrWallet.userId,
              identifier: "User_deposit",
              toEmail: trxData.userId.email,
              content,
            });
          }

          Referralcommission("BNB", parseFloat(amount), usrWallet.userId);

          // return res
          //     .status(200)
          //     .json({ success: true, message: "Deposited successfully" });
        }
      }
    }
    reachMinDeposit(usrWallet.userId, currencyDoc, assetId, amount >= currencyDoc.minimumDeposit)
    return res
      .status(200)
      .json({ success: true, message: "Deposited successfully" });
  } catch (err) {
    console.log("------------err on eth webhook", err);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const reachMinDeposit = async (userId, currencyDoc, assetId, depStatus) => {
  try {
    let list = await DepositHash.aggregate([
      {
        $match: {
          userId: ObjectId(userId),
          currencyId: ObjectId(currencyDoc._id),
          network: "BNB",
          assetEntry: false,
        },
      },
      {
        $group: {
          _id: null,
          hashList: { $push: "$$ROOT" },
          amount: { $sum: "$amount" },
        },
      },
    ]);
    let minAmount = !depStatus ? currencyDoc.minimumDeposit : 0
    if (list.length > 0) {
      if (list[0].amount >= minAmount) {
        for (let hashData of list[0].hashList) {
          try {
            let hashDoc = await DepositHash.findOneAndUpdate(
              {
                _id: hashData._id,
                assetEntry: false,
              },
              { assetEntry: true }
            );
            if (hashDoc) {
              let insertTrx = await Transaction.findOneAndUpdate(
                {
                  txid: hashDoc.hash,
                },
                {
                  userId: hashDoc.userId,
                  coin: currencyDoc.coin,
                  toAddress: hashDoc.userAddress,
                  fromAddress: hashDoc.fromAddress,
                  amount: hashDoc.amount,
                  currencyId: currencyDoc._id,
                  paymentType: "coin_deposit",
                  status: "completed",
                  userCode: IncCntObjId(hashDoc.userId),
                },
                { upsert: true }
              );
              if (!insertTrx) {
                let trxData = await Transaction.findOne({ txid: hashDoc.hash });
                console.log("trxData: ", trxData);
                if (trxData) {
                  let redisBal = await hincbyfloat(
                    "walletbalance_spot",
                    hashDoc.userId + "_" + assetId,
                    parseFloat(hashDoc.amount)
                  );

                  // CREATE PASS_BOOK
                  createPassBook({
                    userId: hashDoc.userId,
                    coin: currencyDoc.coin,
                    currencyId: currencyDoc._id,
                    tableId: trxData._id,
                    beforeBalance: parseFloat(redisBal - hashDoc.amount),
                    afterBalance: parseFloat(redisBal),
                    amount: parseFloat(hashDoc.amount),
                    type: "coin_deposit",
                    category: "credit",
                  });

                  let content = {
                    date: new Date(),
                    amount: parseFloat(hashDoc.amount),
                    transactionId: trxData.txid,
                    currency: currencyDoc.coin,
                  };
                  sendMail({
                    userId: hashDoc.userId,
                    identifier: "User_deposit",
                    content,
                  });
                  let doc = {
                    userId: hashDoc.userId.toString(),
                    title: "Deposit",
                    description: `${hashDoc.amount} ${currencyDoc.coin} - Deposited successfully`,
                  };
                  notification(doc);
                }
              }
            }
          } catch (err) { }
        }
      }
    }
    return true
  } catch (err) {
    return false
  }
};

let depCronStart = false
export const bnbMovetoAdminCron_new = async () => {
  try {
    console.log("inside bntmoveadmin....////////////")
    if (depCronStart) {
      return false;
    }
    depCronStart = true;
    console.log("proceeding...////////////")

    let depositList = await DepositHash.aggregate([
      {
        $match: {
          network: "BNB",
        },
      },
      {
        $group: {
          _id: {
            userId: "$userId",
            currencyId: "$currencyId",
          },
          tableIds: { $push: "$_id" },
          userAddress: { $first: "$userAddress" },
          amount: { $sum: "$amount" },
          coin: { $first: "$coin" },
        },
      },
      {
        $addFields: {
          sortPriority: {
            $cond: [{ $eq: ["$coin", "BNB"] }, 0, 1],
          },
        },
      },
      { $sort: { sortPriority: -1 } }
    ]);
    console.log("depositList-----------------: ", depositList)
    if (
      depositList &&
      depositList.length > 0
    ) {
      let curList = await Currency.find({
        $or: [{ type: "crypto" }, { gateWay: "BEB" }],
      }).lean();
      // console.log("curList-----------------: ", curList)
      if (curList &&
        curList.length > 0 && config.coinGateway.bnb.address) {
        for (let item of depositList) {
          let curData = curList.find(
            (el) => el._id.toString() == item._id.currencyId.toString()
          );
          if (curData && item.amount >= curData.minimumDeposit) {
            let usrWallet = await Assets.findOne({
              currencyAddress: { $regex: item.userAddress, $options: "i" },
            }).lean();
            console.log('usrWallet-----------------: ', usrWallet);
            if (usrWallet) {
              if (curData.currencySymbol == 'BNB') {
                console.log("////////////////// inside bnb move to admin ///////////")
                const { status } = await amountMoveToAdmin({
                  usrAddress: item.userAddress,
                  usrPrivateKey: usrWallet.privateKey,
                  amount: item.amount,
                });
                if (status) {
                  await DepositHash.deleteMany({
                    _id: { $in: item.tableIds },
                  });
                }
              } else {
                let { status } = await tokenMoveToAdmin({
                  contractAddress: curData.contractAddress,
                  amount: item.amount,
                  usrPrivateKey: usrWallet.privateKey,
                  usrAddress: item.userAddress,
                });
                if (status) {
                  await DepositHash.deleteMany({
                    _id: { $in: item.tableIds },
                  });
                }
              }

            }
          }
        }
      }
    }

    depCronStart = false;
    return true;
  } catch (err) {
    console.log("ethMovetoAdminCron Err :", err);
    return false;
  }
}
// bnbMovetoAdminCron_new()

export const bnbContactCheck = async (data) => {
  try {
    let auth = bnbServSign({
      id: config.coinGateway.bnb.id,
    });
    if (!auth.status) {
      return false;
    }
    let respData = await axios({
      method: "post",
      url: `${config.coinGateway.bnb.serverURL}/new-contract-Info`,
      headers: {
        Authorization: auth.token,
        "Accept-Encoding": "gzip,deflate,compress",
      },
      data,
    });

    if (respData && respData.data && respData.data.status == true) {
      return {
        status: true,
        result: respData.data.result
      };
    } else {
      return {
        status: false,
      };
    }
  } catch (err) {
    console.log("bnbContactCheck Err :", err);
    return false;
  }
}


export const withServiceFee = (price, serviceFee) => {
  price = parseFloat(price);
  serviceFee = parseFloat(serviceFee);
  return price - price * (serviceFee / 100);
};

let auth = bnbServSign({
  id: config.coinGateway.bnb.id,
});
try {
  let response = await axios({
    method: "get",
    url: `${config.coinGateway.bnb.serverURL}/Info`,
    headers: {
      Authorization: auth.token,
      "Accept-Encoding": "gzip,deflate,compress",
    },
  });
  console.log("BNB node connection test:", response.data);
} catch (err) {
  console.log("BNB node connection error:", err.message);
}