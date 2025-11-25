// import package
import mongoose from "mongoose";
import node2fa from "node-2fa";
import multer from "multer";
import path from "path";
import { Referralcommission } from "./referralcommission.controller";
// import model
import {
  User,
  UserKyc,
  Assets,
  Transaction,
  Admin,
  Currency,
  PassBook,
} from "../models";
const ObjectsToCsv = require("objects-to-csv");
// import controller
import { mailTemplateLang } from "./emailTemplate.controller";
import * as coinpaymentGateway from "./coin/coinpaymentGateway";
import { newNotification } from "./notification.controller";

// import config
import config from "../config";
import * as ethGateway from "./coin/ethGateway";
import * as bnbGateway from "./coin/bnbGateway";
// import lib
// import { comparePassword } from '../lib/bcrypt';
import imageFilter from "../lib/imageFilter";
import isEmpty from "../lib/isEmpty";
import { encryptString, decryptString } from "../lib/cryptoJS";
import { precentConvetPrice, commissionFeeCalculate } from "../lib/calculation";
import { paginationQuery, filterSearchQuery } from "../lib/adminHelpers";
import { deposit, ERC20_Deposit } from "./coin/ethGateway";
import { createPassBook } from "./passbook.controller";
import WAValidator from 'multicoin-address-validator';
const ObjectId = mongoose.Types.ObjectId;

/**
 * Multer Image Uploade
 */
const walletStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.IMAGE.DEPOSIT_PATH);
  },

  // By default, multer removes file extensions so let's add them back
  filename: function (req, file, cb) {
    cb(null, "file-" + Date.now() + path.extname(file.originalname));
  },
});

let walletUpload = multer({
  storage: walletStorage,
  fileFilter: imageFilter,
  limits: { fileSize: config.IMAGE.DEFAULT_SIZE },
}).fields([{ name: "image", maxCount: 1 }]);

export const uploadWalletDoc = (req, res, next) => {
  walletUpload(req, res, function (err) {
    if (!isEmpty(req.validationError)) {
      return res.status(400).json({
        success: false,
        errors: {
          [req.validationError.fieldname]: req.validationError.messages,
        },
      });
    } else if (err instanceof multer.MulterError) {
      return res
        .status(400)
        .json({ success: false, errors: { [err.field]: "TOO_LARGE" } });
    } else if (err) {
      return res
        .status(500)
        .json({ success: false, message: "SOMETHING_WRONG" });
    }
    return next();
  });
};

/**
 * Check User KYC
 */
export const checkUserKyc = async (req, res, next) => {
  try {
    let userKyc = await UserKyc.findOne({ userId: req.user.id });
    if (!userKyc) {
      return res
        .status(400)
        .json({ success: false, message: "KYC_SUBMIT_ALERT" });
    }
    if (
      userKyc.idProof.status == "approved" &&
      userKyc.addressProof.status == "approved"
    ) {
      return next();
    } else {
      return res
        .status(400)
        .json({ success: false, message: "KYC_SUBMIT_ALERT" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

/**
 * User Withdraw
 * URL: /api/fiatWithdraw
 * METHOD : POST
 * BODY: currencyId, amount, bankId, twoFACode
 */
export const withdrawFiatRequest = async (req, res) => {
  try {
    let reqBody = req.body;
    reqBody.amount = parseFloat(reqBody.amount);
    let userData = await User.findOne({
      _id: req.user.id,
      "bankDetails._id": reqBody.bankId,
    });

    if (!userData) {
      return res
        .status(400)
        .json({ success: false, errors: { bankId: "INVALID_BANK_ACCOUNT" } });
    }

    if (userData.google2Fa.secret == "") {
      return res
        .status(500)
        .json({ success: false, errors: { twoFACode: "TWO_FA_MSG" } });
    }

    let verifyTwoFaCode = node2fa.verifyToken(
      userData.google2Fa.secret,
      reqBody.twoFACode
    );
    if (!(verifyTwoFaCode && verifyTwoFaCode.delta == 0)) {
      if (verifyTwoFaCode == null)
        return res
          .status(400)
          .json({ success: false, errors: { twoFACode: "Invalid 2FA code" } });
      if (verifyTwoFaCode && verifyTwoFaCode.delta == -1) {
        return res.status(400).json({
          success: false,
          errors: { twoFACode: "Expired 2FA code" },
        });
      }
    }

    let bankDetails = userData.bankDetails.id(reqBody.bankId);

    if (!bankDetails) {
      return res
        .status(400)
        .json({ success: false, errors: { bankId: "INVALID_BANK_ACCOUNT" } });
    }

    let userAssetData = await Assets.findOne({
      userId: req.user.id,
      currency: reqBody.currencyId,
    }).populate("currency");

    let balance = userAssetData.spotwallet;

    if (!userAssetData) {
      return res.status(400).json({ success: false, message: "NO_DATA" });
    }

    if (userAssetData && !userAssetData.currency) {
      return res.status(400).json({ success: false, message: "NO_DATA" });
    }

    let finalAmount = 100;
    if (userAssetData.currency.withdrawFeeType == "flat") {
      finalAmount = parseFloat(reqBody.amount) + parseFloat(userAssetData.currency.withdrawFeeFlat);
    } else {
      finalAmount = reqBody.amount +
        precentConvetPrice(reqBody.amount, userAssetData.currency.withdrawFee);
    }

    if (userAssetData.spotwallet < finalAmount) {
      return res.status(400).json({
        success: false,
        errors: { finalAmount: "INSUFFICIENT_BALANCE" },
      });
    }

    if (userAssetData.currency.minimumWithdraw > finalAmount) {
      return res
        .status(400)
        .json({ success: false, errors: { finalAmount: "WITHDRAW_TOO_LOW" } });
    }

    var transactions = new Transaction();
    transactions["userId"] = req.user.id;
    transactions["currencyId"] = reqBody.currencyId;
    transactions["currencySymbol"] = userAssetData.currency.currencySymbol;
    transactions["amount"] = finalAmount;
    transactions["actualAmount"] = reqBody.amount;
    transactions["paymentType"] = "fiat_withdraw";
    transactions["commissionFee"] = userAssetData.currency.withdrawFeeType == "flat" ? userAssetData.currency.withdrawFeeFlat : userAssetData.currency.withdrawFee;
    transactions["bankDetail"] = bankDetails;
    transactions["commissionFeeType"] = userAssetData.currency.withdrawFeeType;
    transactions["status"] = "new";

    userAssetData.spotwallet = userAssetData.spotwallet - finalAmount;
    await userAssetData.save();
    let trxData = await transactions.save();

    //New passbook
    let passbookData = {};
    passbookData.userId = userAssetData.userId;
    passbookData.coin = userAssetData.currency.currencySymbol;
    passbookData.currencyId = userAssetData.currency;
    passbookData.tableId = userAssetData._id;
    passbookData.beforeBalance = balance;
    passbookData.afterBalance = userAssetData.spotwallet;
    passbookData.amount = finalAmount;
    passbookData.type = "fiat_withdraw_request";
    passbookData.category = "debit";
    createPassBook(passbookData);

    //End

    let encryptToken = encryptString(trxData._id, true);
    let content = {
      name: userData.firstName,
      confirmMailUrl: `${config.FRONT_URL}/withdraw-fiat-verification/${encryptToken}`,
    };

    mailTemplateLang({
      userId: req.user.id,
      identifier: "withdraw_request",
      toEmail: userData.email,
      content,
    });

    newNotification({
      userId: trxData.userId,
      currencyId: trxData.currencyId,
      transactionId: trxData._id,
      trxId: trxData._id,
      currencySymbol: trxData.currencySymbol,
      amount: trxData.amount,
      paymentType: trxData.paymentType,
      status: trxData.status,
      description: "Withdraw request verification send to your email",
    });

    return res
      .status(200)
      .json({ success: true, message: "VERIFICATION_LINK" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

/**
 * User Withdraw
 * URL: /api/fiatWithdraw
 * METHOD : PATCH
 * BODY: token
 */
export const fiatRequestVerify = async (req, res) => {
  try {
    let reqBody = req.body;
    let transactionId = decryptString(reqBody.token, true);
    let trxData = await Transaction.findOne({
      _id: transactionId,
      paymentType: "fiat_withdraw",
    });
    if (!trxData) {
      return res.status(400).json({ success: false, message: "INVALID_TOKEN" });
    }

    if (trxData.status != "new") {
      return res.status(400).json({ success: false, message: "EXPIRY_TOKEN" });
    }

    trxData.status = "pending";
    let updateTrxData = await trxData.save();

    newNotification({
      userId: updateTrxData.userId,
      currencyId: updateTrxData.currencyId,
      transactionId: updateTrxData._id,
      trxId: updateTrxData._id,
      currencySymbol: updateTrxData.currencySymbol,
      amount: updateTrxData.amount,
      paymentType: updateTrxData.paymentType,
      status: updateTrxData.status,
    });
    let adminDetail = await Admin.findOne({ role: "superadmin" });
    newNotification({
      userId: updateTrxData.userId,
      adminId: adminDetail._id,
      viewType: "admin",
      type: "New Fait Withdraw request",
      description: "Withdraw request send to admin",
      createdAt: new Date(),
    });
    return res
      .status(200)
      .json({ success: true, message: "Successfully verify withdraw request" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

/**
 * Coin Withdraw
 * URL: /api/coinWithdraw
 * METHOD : POST
 * BODY: currencyId, amount, receiverAddress, twoFACode
 */
export const withdrawCoinRequest = async (req, res) => {
  try {
    let reqBody = req.body;
    reqBody.amount = parseFloat(reqBody.amount);
    let userData = await User.findOne({ _id: req.user.id });

    if (userData.google2Fa.secret == "") {
      return res
        .status(500)
        .json({ success: false, errors: { twoFACode: "TWO_FA_MSG" } });
    }

    let verifyTwoFaCode = node2fa.verifyToken(
      userData.google2Fa.secret,
      reqBody.twoFACode
    );
    if (!(verifyTwoFaCode && verifyTwoFaCode.delta == 0)) {
      if (verifyTwoFaCode == null)
        return res
          .status(400)
          .json({ success: false, errors: { twoFACode: "Invalid 2FA code" } });
      if (verifyTwoFaCode && verifyTwoFaCode.delta == -1) {
        return res.status(400).json({
          success: false,
          errors: { twoFACode: "Expired 2FA code" },
        });
      }
    }
    let userAssetData = await Assets.findOne({
      userId: req.user.id,
      currency: reqBody.currencyId,
    }).populate("currency");

    console.log("userAssetData=====", userAssetData);

    let balance = userAssetData.spotwallet;
    if (!userAssetData) {
      return res.status(400).json({ success: false, message: "NO_DATA" });
    }

    let errors = {}, currencyData="ETH"
    if(userAssetData.currency.gateWay=="CoinPayment"){
      let symboleAddress=userAssetData.currency.currencySymbol.split(".")
      console.log("checccccadddddddddd",symboleAddress,symboleAddress.length,userAssetData.currency.type);
      if(symboleAddress.length==1){
        if(userAssetData.currency.type=="crypto"){
          currencyData=userAssetData.currency.currencySymbol
        }
      }else if(symboleAddress.length==2){
         if((symboleAddress[1]=="BEP20") ||(symboleAddress[1]=="BEP2")){
          currencyData="bnb"
         }
      }
    }
    if(userAssetData.currency.gateWay=="ERC"){
      currencyData="ETH"
    }
    var valid = WAValidator.validate(reqBody.receiverAddress, currencyData);
    console.log("checccccadddddddddd",valid,currencyData,userAssetData.currency.gateWay);
    if (!valid)
      errors.receiverAddress = 'Address INVALID';

    if (!isEmpty(errors)) {
      return res.status(400).json({ "errors": errors })
    }
    if (reqBody.amount < userAssetData.currency.minimumWithdraw) {
      return res.status(400).json({
        success: false,
        message:
          "Please Enter Greater than " + userAssetData.currency.minimumWithdraw,
      });
    }
    if (reqBody.amount > userAssetData.currency.withdrawLimit) {
      return res.status(400).json({
        success: false,
        message:
          "Please Enter Amount Less than " +
          userAssetData.currency.withdrawLimit,
      });
    }
    if (userAssetData && !userAssetData.currency) {
      return res.status(400).json({ success: false, message: "NO_DATA" });
    }
    let finalAmount = 100;
    if (userAssetData.currency.withdrawFeeType == "flat") {
      finalAmount = parseFloat(reqBody.amount) + parseFloat(userAssetData.currency.withdrawFeeFlat);
    } else {
      finalAmount = reqBody.amount +
        precentConvetPrice(reqBody.amount, userAssetData.currency.withdrawFee);
    }

    if (userAssetData.spotwallet < finalAmount) {
      return res.status(400).json({
        success: false,
        errors: { finalAmount: "INSUFFICIENT_BALANCE" },
      });
    }

    var transactions = new Transaction();

    transactions["userId"] = req.user.id;
    transactions["currencyId"] = reqBody.currencyId;
    transactions["currencySymbol"] = userAssetData.currency.currencySymbol;
    transactions["fromaddress"] = userAssetData.currencyAddress;
    transactions["toaddress"] = reqBody.receiverAddress;
    transactions["amount"] = finalAmount;
    transactions["actualAmount"] = reqBody.amount;
    transactions["paymentType"] = "coin_withdraw";
    transactions["commissionFee"] = userAssetData.currency.withdrawFeeType == "flat" ? userAssetData.currency.withdrawFeeFlat : userAssetData.currency.withdrawFee;
    transactions["txid"] = "";
    transactions["status"] = "new";
    transactions["commissionFeeType"] = userAssetData.currency.withdrawFeeType;
    transactions["tag"] = reqBody.tag ? reqBody.tag : "";
    userAssetData.spotwallet = userAssetData.spotwallet - finalAmount;
    await userAssetData.save();

    //New passbook
    let passbookData = {};
    passbookData.userId = userAssetData.userId;
    passbookData.coin = userAssetData.currency.currencySymbol;
    passbookData.currencyId = userAssetData.currency;
    passbookData.tableId = userAssetData._id;
    passbookData.beforeBalance = balance;
    passbookData.afterBalance = userAssetData.spotwallet;
    passbookData.amount = finalAmount;
    passbookData.type = "Withdraw Coin Request";
    passbookData.category = "debit";
    createPassBook(passbookData);

    //End

    let trxData = await transactions.save();

    let encryptToken = encryptString(trxData._id, true);
    let content = {
      name: userData.firstName,
      confirmMailUrl: `${config.FRONT_URL}/withdraw-coin-verification/${encryptToken}`,
    };

    mailTemplateLang({
      userId: req.user.id,
      identifier: "withdraw_request",
      toEmail: userData.email,
      content,
    });

    newNotification({
      userId: trxData.userId,
      currencyId: trxData.currencyId,
      transactionId: trxData._id,
      trxId: trxData._id,
      currencySymbol: trxData.currencySymbol,
      amount: trxData.amount,
      paymentType: trxData.paymentType,
      status: trxData.status,
      description: "Withdraw request verification send to your email",
    });

    return res
      .status(200)
      .json({ success: true, message: "VERIFICATION_LINK" });
  } catch (err) {
    console.log(err, "errrr");
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

/**
 * User Withdraw
 * URL: /api/fiatWithdraw
 * METHOD : PATCH
 * BODY: token
 */
export const coinRequestVerify = async (req, res) => {
  try {
    let reqBody = req.body;
    let transactionId = decryptString(reqBody.token, true);
    let trxData = await Transaction.findOne({
      _id: transactionId,
      paymentType: "coin_withdraw",
    });
    if (!trxData) {
      return res.status(400).json({ success: false, message: "INVALID_TOKEN" });
    }

    if (trxData.status != "new") {
      return res.status(400).json({ success: false, message: "EXPIRY_TOKEN" });
    }

    trxData.status = "pending";
    let updateTrxData = await trxData.save();

    newNotification({
      userId: updateTrxData.userId,
      currencyId: updateTrxData.currencyId,
      transactionId: updateTrxData._id,
      trxId: updateTrxData._id,
      currencySymbol: updateTrxData.currencySymbol,
      amount: updateTrxData.amount,
      paymentType: updateTrxData.paymentType,
      status: updateTrxData.status,
    });

    let adminDetail = await Admin.findOne({ role: "superadmin" });
    newNotification({
      userId: updateTrxData.userId,
      adminId: adminDetail._id,
      viewType: "admin",
      type: "New Crypto Withdraw request",
      description: "Withdraw request send to admin",
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Successfully verified withdraw request",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

/**
 * Sent Deposit Request To Admin
 * URL: /api/depositRequest
 * METHOD : POST
 * BODY : userAssetId, amount, image
 */
export const depositRequest = async (req, res) => {
  try {
    let reqBody = req.body;
    let reqFile = req.files;

    let userAsset = await Assets.findOne({
      _id: reqBody.userAssetId,
    }); /* .populate("currency") */

    console.log("dddddddd494", userAsset);
    let balance = userAsset.spotwallet;

    if (!userAsset) {
      return res.status(400).json({ success: false, message: "NO_DATA" });
    }
    let currencyDoc = await Currency.findOne({
      currencySymbol: userAsset.currencySymbol,
    });
    console.log(
      "userAssetuserAssetuserAssetuserAssetuserAsset",
      currencyDoc.minimumdeposit,
      reqBody.amount
    );
    if (currencyDoc.minimumdeposit > reqBody.amount) {
      return res.status(400).json({
        status: false,
        // errors: {
        message: "Please enter amount greater than minimum deposit",
        // },
      });
    }

    let newDoc = new Transaction({
      userId: req.user.id,
      currencyId: userAsset.currency,
      actualAmount: reqBody.amount,
      amount: reqBody.amount,
      currencySymbol: userAsset.currencySymbol,
      status: "pending",
      paymentType: "fiat_deposit",
      image: reqFile.image[0].filename,
      // commissionFee: userAsset.currency.depositCharge,
      userAssetId: reqBody.userAssetId,
    });

    let updateTrxData = await newDoc.save();

    //End

    newNotification({
      userId: updateTrxData.userId,
      currencyId: updateTrxData.currencyId,
      transactionId: updateTrxData._id,
      trxId: updateTrxData._id,
      currencySymbol: updateTrxData.currencySymbol,
      amount: updateTrxData.amount,
      paymentType: updateTrxData.paymentType,
      status: updateTrxData.status,
    });

    let adminDetail = await Admin.findOne({ role: "superadmin" });
    newNotification({
      adminId: adminDetail._id,
      viewType: "admin",
      type: "New Fiat Deposit request",
      description: "New Fiat Deposit request...",
      createdAt: new Date(),
    });

    return res
      .status(200)
      .json({ success: true, message: "DEPOSIT_REQUEST_SUCCESS" });
  } catch (err) {
    console.log("errerrerrerrerrerrerrerrerrerrerr", err);
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

/**
 * Wallet Transfer
 * URL: /api/walletTransfer
 * METHOD : POST
 * BODY : fromType, toType, userAssetId, amount
 */
export const walletTransfer = async (req, res) => {
  try {
    let reqBody = req.body;
    reqBody.amount = parseFloat(reqBody.amount);

    let userAssetData = await Assets.findOne({
      _id: reqBody.userAssetId,
      userId: req.user.id,
    }).populate("currency");
    if (!userAssetData) {
      return res.status(400).json({ success: false, message: "NO_DATA" });
    }

    if (userAssetData && !userAssetData.currency) {
      return res.status(400).json({ success: false, message: "NO_DATA" });
    }

    let newTrnx = new Transaction({
      userId: req.user.id,
      currencyId: userAssetData.currency,
      actualAmount: reqBody.amount,
      amount: reqBody.amount,
      currencySymbol: userAssetData.currencySymbol,
      status: "completed",
      paymentType:
        userAssetData.currency.type == "INR"
          ? "fiat_transfer"
          : "coin_transfer",
      userAssetId: userAssetData._id,
    });

    let beforeBal = 0;

    if (reqBody.fromType == "derivative" && reqBody.toType == "spot") {
      if (userAssetData.derivativeWallet < reqBody.amount) {
        return res
          .status(400)
          .json({ success: false, message: "INSUFFICIENT_BALANCE" });
      }
      beforeBal = userAssetData.spotwallet;

      userAssetData.spotwallet = userAssetData.spotwallet + reqBody.amount;
      let passbookData = {};
      passbookData.userId = userAssetData.userId;
      passbookData.coin = userAssetData.currencySymbol;
      passbookData.currencyId = userAssetData.currency;
      passbookData.tableId = newTrnx._id;
      passbookData.beforeBalance = beforeBal;
      passbookData.afterBalance = userAssetData.spotwallet;
      passbookData.amount = reqBody.amount;
      passbookData.type = "wallet_tranfer";
      passbookData.category = "credit";
      await createPassBook(passbookData);

      beforeBal = userAssetData.derivativeWallet;
      userAssetData.derivativeWallet =
        userAssetData.derivativeWallet - reqBody.amount;
      let passSec = {};
      passSec.userId = userAssetData.userId;
      passSec.coin = userAssetData.currencySymbol;
      passSec.currencyId = userAssetData.currency;
      passSec.tableId = newTrnx._id;
      passSec.beforeBalance = beforeBal;
      passSec.afterBalance = userAssetData.derivativeWallet;
      passSec.amount = reqBody.amount;
      passSec.type = "wallet_tranfer";
      passSec.category = "debit";
      await createPassBook(passSec);
    } else if (reqBody.fromType == "spot" && reqBody.toType == "derivative") {
      if (userAssetData.spotwallet < reqBody.amount) {
        return res
          .status(400)
          .json({ success: false, message: "INSUFFICIENT_BALANCE" });
      }
      beforeBal = userAssetData.spotwallet;

      userAssetData.spotwallet = userAssetData.spotwallet - reqBody.amount;
      let passSec = {};
      passSec.userId = userAssetData.userId;
      passSec.coin = userAssetData.currencySymbol;
      passSec.currencyId = userAssetData.currency;
      passSec.tableId = newTrnx._id;
      passSec.beforeBalance = beforeBal;
      passSec.afterBalance = userAssetData.spotwallet;
      passSec.amount = reqBody.amount;
      passSec.type = "wallet_tranfer";
      passSec.category = "debit";
      await createPassBook(passSec);

      beforeBal = userAssetData.derivativeWallet;
      userAssetData.derivativeWallet =
        userAssetData.derivativeWallet + reqBody.amount;
      let passbookData = {};
      passbookData.userId = userAssetData.userId;
      passbookData.coin = userAssetData.currencySymbol;
      passbookData.currencyId = userAssetData.currency;
      passbookData.tableId = newTrnx._id;
      passbookData.beforeBalance = beforeBal;
      passbookData.afterBalance = userAssetData.derivativeWallet;
      passbookData.amount = reqBody.amount;
      passbookData.type = "wallet_tranfer";
      passbookData.category = "credit";
      await createPassBook(passbookData);
    } else if (reqBody.fromType == "spot" && reqBody.toType == "p2p") {
      if (
        userAssetData.spotwallet <= 0 ||
        userAssetData.spotwallet < reqBody.amount
      ) {
        return res
          .status(400)
          .json({ success: false, message: "INSUFFICIENT_BALANCE" });
      }
      beforeBal = userAssetData.spotwallet;

      userAssetData.spotwallet = userAssetData.spotwallet - reqBody.amount;
      let passSec = {};
      passSec.userId = userAssetData.userId;
      passSec.coin = userAssetData.currencySymbol;
      passSec.currencyId = userAssetData.currency;
      passSec.tableId = newTrnx._id;
      passSec.beforeBalance = beforeBal;
      passSec.afterBalance = userAssetData.spotwallet;
      passSec.amount = reqBody.amount;
      passSec.type = "wallet_tranfer";
      passSec.category = "debit";
      await createPassBook(passSec);

      beforeBal = userAssetData.p2pbalance;
      userAssetData.p2pbalance = userAssetData.p2pbalance + reqBody.amount;
      let passbookData = {};
      passbookData.userId = userAssetData.userId;
      passbookData.coin = userAssetData.currencySymbol;
      passbookData.currencyId = userAssetData.currency;
      passbookData.tableId = newTrnx._id;
      passbookData.beforeBalance = beforeBal;
      passbookData.afterBalance = userAssetData.p2pbalance;
      passbookData.amount = reqBody.amount;
      passbookData.type = "wallet_tranfer";
      passbookData.category = "credit";
      await createPassBook(passbookData);
    } else if (reqBody.fromType == "p2p" && reqBody.toType == "spot") {
      if (
        userAssetData.p2pbalance <= 0 ||
        userAssetData.p2pbalance < reqBody.amount
      ) {
        return res
          .status(400)
          .json({ success: false, message: "INSUFFICIENT_BALANCE" });
      }
      beforeBal = userAssetData.spotwallet;
      userAssetData.spotwallet = userAssetData.spotwallet + reqBody.amount;
      let passbookData = {};
      passbookData.userId = userAssetData.userId;
      passbookData.coin = userAssetData.currencySymbol;
      passbookData.currencyId = userAssetData.currency;
      passbookData.tableId = newTrnx._id;
      passbookData.beforeBalance = beforeBal;
      passbookData.afterBalance = userAssetData.spotwallet;
      passbookData.amount = reqBody.amount;
      passbookData.type = "wallet_tranfer";
      passbookData.category = "credit";
      await createPassBook(passbookData);

      beforeBal = userAssetData.p2pbalance;

      userAssetData.p2pbalance = userAssetData.p2pbalance - reqBody.amount;
      let passSec = {};
      passSec.userId = userAssetData.userId;
      passSec.coin = userAssetData.currencySymbol;
      passSec.currencyId = userAssetData.currency;
      passSec.tableId = newTrnx._id;
      passSec.beforeBalance = beforeBal;
      passSec.afterBalance = userAssetData.p2pbalance;
      passSec.amount = reqBody.amount;
      passSec.type = "wallet_tranfer";
      passSec.category = "debit";
      await createPassBook(passSec);
    } else {
      return res
        .status(400)
        .json({ success: false, message: "SOMETHING_WRONG" });
    }

    await userAssetData.save();
    await newTrnx.save();
    newNotification({
      userId: req.user.id,
      type: "WALLET TRANSFER",
      description: "wallet transfer success",
    });
    return res.json({ status: true, message: "WALLET_TRANSFER_SUCCESS" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

/**
 * Get Transaction History
 * URL: /api/history/transaction/fiat
 * METHOD : GET
 */
export const getTrnxHistory = async (req, res) => {
  try {
    console.log(req, "txn req");
    const { paymentType } = req.params;
    let pagination = paginationQuery(req.query);
    let filter = filterSearchQuery(req.query, ["currencySymbol", "status"]);

    if (!["fiat", "crypto".includes(paymentType)]) {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }

    if (["withdraw", "deposit", "transfer"].includes(req.query.paymentType)) {
      filter["paymentType"] = { $in: [req.query.paymentType] };
    } else {
      if (paymentType == "fiat") {
        filter["paymentType"] = {
          $in: ["fiat_deposit", "fiat_withdraw", "fiat_transfer"],
        };
      } else if (paymentType == "crypto") {
        filter["paymentType"] = {
          $in: ["coin_deposit", "coin_withdraw", "coin_transfer"],
        };
      }
    }

    filter["userId"] = req.user.id;

    const count = await Transaction.countDocuments(filter);
    const data = await Transaction.find(filter, {
      createdAt: 1,
      paymentType: 1,
      currencySymbol: 1,
      amount: 1,
      bankDetail: 1,
      status: 1,
      toaddress: 1,
      txid:1
    }).sort({_id:-1})
      .skip(pagination.skip)
      .limit(pagination.limit);

    let result = {
      data,
      count: count,
    };
    return res.status(200).json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

/**
 * Get Withdraw List
 * URL : /adminapi/withdrawList
 * METHOD : GET
 */
export const getWithdrawList = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let filter = filterSearchQuery(req.query, [
      "email",
      "toaddress",
      "currencySymbol",
      "amount",
      "txid",
      "status",
    ]);

    let count = await Transaction.aggregate([
      {
        $match: {
          paymentType: { $in: ["coin_withdraw", "fiat_withdraw"] },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          email: "$userInfo.email",
          phoneNo: "$userInfo.phoneNo",
          currencySymbol: 1,
          amount: 1,
          actualAmount: 1,
          commissionFee: 1,
          bankDetail: 1,
          txid: 1,
          toaddress: 1,
          status: 1,
          paymentType: 1,
          createdAt: 1
        },
      },
      { $match: filter },
    ]);

    let data = await Transaction.aggregate([
      {
        $match: {
          paymentType: { $in: ["coin_withdraw", "fiat_withdraw"] },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          email: "$userInfo.email",
          phoneNo: "$userInfo.phoneNo",
          currencySymbol: 1,
          amount: 1,
          actualAmount: 1,
          commissionFee: 1,
          bankDetail: 1,
          txid: 1,
          toaddress: 1,
          status: 1,
          paymentType: 1,
          commissionFeeType: 1,
          createdAt: 1,
        },
      },
      { $match: filter },
      { $skip: pagination.skip },
      { $limit: pagination.limit },
    ]);

    let result = {
      data,
      count: count.length,
    };
    return res.status(200).json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

/**
 * Approve Coin Withdraw
 * URL: /adminapi/coinWithdraw/approve
 * METHOD : POST
 * BODY: transactionId
 */
export const coinWithdrawApprove = async (req, res) => {
  try {
    let reqParam = req.params;

    let trxData = await Transaction.findOne({
      _id: req.params.transactionId,
      paymentType: "coin_withdraw",
    })
      .populate("currencyId")
      .populate("userId");

    if (!trxData) {
      return res.status(400).json({ success: false, message: "Invalid Token" });
    }
    if (trxData.currencyId && trxData.currencyId.type == "crypto") {
      if (trxData.currencyId.currencySymbol == "ETH") {

        let { status, message, data } = await ethGateway.amountMoveToUser({
          userAddress: trxData.toaddress,
          amount: trxData.actualAmount,
          fromAddress: config.coinGateway.eth.address,
          privateKey: decryptString(config.coinGateway.eth.privateKey),
          toAddress: trxData.toaddress,
        });

        if (!status) {
          return res
            .status(400)
            .json({ success: false, message });
        }

        trxData.status = "completed";
        trxData.txid = data.transactionHash;

        // trxData.txid = ethWithdraw.trxId.transactionHash;
        let updateTrxData = await trxData.save();

        newNotification({
          userId: updateTrxData.userId,
          currencyId: updateTrxData.currencyId,
          transactionId: updateTrxData._id,
          trxId: updateTrxData._id,
          currencySymbol: updateTrxData.currencySymbol,
          amount: updateTrxData.amount,
          paymentType: updateTrxData.paymentType,
          status: updateTrxData.status,
        });
      } else  if (trxData.currencyId.currencySymbol == "BNB") {

        let { status, message, data } = await bnbGateway.amountMoveToUser({
          userAddress: trxData.toaddress,
          amount: trxData.actualAmount,
        });
        console.log("bnbGatewayITHDRASAW",status, message, data)
        if (!status) {
          return res
            .status(400)
            .json({ success: false, message });
        }

        trxData.status = "completed";
        trxData.txid = data.transactionHash;

        // trxData.txid = ethWithdraw.trxId.transactionHash;
        let updateTrxData = await trxData.save();

        newNotification({
          userId: updateTrxData.userId,
          currencyId: updateTrxData.currencyId,
          transactionId: updateTrxData._id,
          trxId: updateTrxData._id,
          currencySymbol: updateTrxData.currencySymbol,
          amount: updateTrxData.amount,
          paymentType: updateTrxData.paymentType,
          status: updateTrxData.status,
        });
      } else {
        let FinalWIthdrawAmount =
          trxData.actualAmount + trxData.currencyId.CoinpaymetNetWorkFee;
        const btcWithdraw = await coinpaymentGatway.createWithdrawal({
          currencySymbol: trxData.currencyId.currencySymbol,
          amount: FinalWIthdrawAmount,
          address: trxData.toaddress,
          dest_tag: trxData.tag ? trxData.tag : "",
        });

        // const btcWithdraw = await btcGateway.amountMoveToUser({
        //     'userAddress': trxData.toaddress,
        //     'amount': trxData.amount,
        // })

        if (!btcWithdraw.status) {
          // trxData.status = 'pending';
          // await trxData.save();
          return res
            .status(400)
            .json({ success: false, message: btcWithdraw.message });
        }

        trxData.txid = btcWithdraw.data.id;
        // trxData.txid = btcWithdraw.trxId;
        trxData.status = 'completed';
        let updateTrxData = await trxData.save();

        newNotification({
          userId: updateTrxData.userId,
          currencyId: updateTrxData.currencyId,
          transactionId: updateTrxData._id,
          trxId: updateTrxData._id,
          currencySymbol: updateTrxData.currencySymbol,
          amount: updateTrxData.amount,
          paymentType: updateTrxData.paymentType,
          status: updateTrxData.status,
        });
      }
    } else if (trxData.currencyId && trxData.currencyId.type == "token") {
      if (trxData.currencyId.gateWay == "ERC") {
        /* ETH Token */
        let { status, message, data } = await ethGateway.tokenMoveToUser({
          // userAddress: trxData.toaddress,
          // amount: trxData.actualAmount,
          // minAbi: trxData.currencyId.minABI,
          // contractAddress: trxData.currencyId.contractAddress,

          amount: trxData.actualAmount,
          fromAddress: config.coinGateway.eth.address,
          privateKey: decryptString(config.coinGateway.eth.privateKey),
          contractAddress: trxData.currencyId.contractAddress,
          toAddress: trxData.toaddress,
          minAbi: trxData.currencyId.minABI,
          decimals: trxData.currencyId.decimals,
        });
        if (!status) {
          // trxData.status = 'pending';
          // await trxData.save();
          return res.status(400).json({ success: false, message: message });
        }
        trxData.txid = data.transactionHash;
        trxData.status = "completed";
        let updateTrxData = await trxData.save();

        newNotification({
          userId: updateTrxData.userId,
          currencyId: updateTrxData.currencyId,
          transactionId: updateTrxData._id,
          trxId: updateTrxData._id,
          currencySymbol: updateTrxData.currencySymbol,
          amount: updateTrxData.amount,
          paymentType: updateTrxData.paymentType,
          status: updateTrxData.status,
        });

        // return res.status(200).json({ 'success': true, 'result': { 'messages': "Success" } })
      } else if (trxData.currencyId.gateWay == "BEB") {
        /* BEB 20 Token */
        let { status, message, data } = await bnbGateway.tokenMoveToUser({
          amount: trxData.actualAmount,
          contractAddress: trxData.currencyId.contractAddress,
          usrAddress: trxData.toaddress,
        });
        if (!status) {
          // trxData.status = 'pending';
          // await trxData.save();
          return res.status(400).json({ success: false, message: message });
        }
        trxData.txid = data.transactionHash;
        trxData.status = "completed";
        let updateTrxData = await trxData.save();

        newNotification({
          userId: updateTrxData.userId,
          currencyId: updateTrxData.currencyId,
          transactionId: updateTrxData._id,
          trxId: updateTrxData._id,
          currencySymbol: updateTrxData.currencySymbol,
          amount: updateTrxData.amount,
          paymentType: updateTrxData.paymentType,
          status: updateTrxData.status,
        });

        // return res.status(200).json({ 'success': true, 'result': { 'messages': "Success" } })
      } else {
        if (trxData.currencyId.gateWay == "CoinPayment") {
          let FinalWIthdrawAmount =
            trxData.actualAmount + trxData.currencyId.CoinpaymetNetWorkFee;
          const btcWithdraw = await coinpaymentGateway.createWithdrawal({
            currencySymbol: trxData.currencyId.currencySymbol,
            amount: FinalWIthdrawAmount,
            address: trxData.toaddress,
          });

          // const btcWithdraw = await btcGateway.amountMoveToUser({
          //     'userAddress': trxData.toaddress,
          //     'amount': trxData.amount,
          // })

          if (!btcWithdraw.status) {
            // trxData.status = 'pending';
            // await trxData.save();
            return res
              .status(400)
              .json({ success: false, message: btcWithdraw.message });
          }

          trxData.txid = btcWithdraw.data.id;
          trxData.status = 'completed';
          let updateTrxData = await trxData.save();

          newNotification({
            userId: updateTrxData.userId,
            currencyId: updateTrxData.currencyId,
            transactionId: updateTrxData._id,
            trxId: updateTrxData._id,
            currencySymbol: updateTrxData.currencySymbol,
            amount: updateTrxData.amount,
            paymentType: updateTrxData.paymentType,
            status: updateTrxData.status,
          });
        }
      }
    } else {
      return res
        .status(500)
        .json({ success: false, message: "Error on server" });
    }

    let content = {
      amount: trxData.actualAmount,
      currency: trxData.currencyId && trxData.currencyId.currencySymbol,
      tranactionId: reqParam.transactionId,
      date: new Date(),
    };

    mailTemplateLang({
      userId: trxData.userId._id,
      identifier: "Withdraw_notification",
      toEmail: trxData.userId.email,
      content,
    });

    return res
      .status(200)
      .json({ success: true, message: "Withdraw successfully" });
  } catch (err) {
    console.log("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", err);
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

/**
 * Reject Coin Withdraw
 * URL: /adminapi/coinWithdraw/reject
 * METHOD : POST
 */
export const coinWithdrawReject = async (req, res) => {
  try {
    let reqParam = req.params;

    let trxData = await Transaction.findOneAndUpdate(
      {
        _id: reqParam.transactionId,
        paymentType: "coin_withdraw",
        status: "pending",
      },
      {
        status: "rejected",
        message: reqParam.message
      },
      { new: true }
    );

    if (!trxData) {
      return res.status(400).json({ success: false, message: "Invalid Token" });
    }

    let usrAsset = await Assets.findOne({
      userId: trxData.userId,
      currency: trxData.currencyId,
    });
    let beforeBalance = parseFloat(usrAsset.spotwallet);
    usrAsset.spotwallet =
      parseFloat(usrAsset.spotwallet) + parseFloat(trxData.amount);

    await usrAsset.save();

    //New passbook
    let passbookData = {};
    passbookData.userId = trxData.userId;
    passbookData.coin = trxData.currencySymbol;
    passbookData.currencyId = trxData.currencyId;
    passbookData.tableId = trxData._id;
    passbookData.beforeBalance = beforeBalance;
    passbookData.afterBalance = parseFloat(usrAsset.spotwallet);
    passbookData.amount = parseFloat(trxData.amount);
    passbookData.type = "Withdraw_Coin_reject";
    passbookData.category = "debit";
    createPassBook(passbookData);

    let userEmail = await User.findOne({ _id: trxData.userId }, { email: 1 }).lean()
    let content = {
      amount: trxData.amount,
      currency: trxData.currencySymbol,
      reason: reqParam.message,
      date: new Date(),
    };
    if (userEmail)
      mailTemplateLang({
        userId: trxData.userId,
        identifier: "User_Withdraw_Request_reject",
        toEmail: userEmail && userEmail.email,
        content,
      });


    //End
    newNotification({
      userId: trxData.userId,
      currencyId: trxData.currencyId,
      transactionId: trxData._id,
      trxId: trxData._id,
      currencySymbol: trxData.currencySymbol,
      amount: trxData.amount,
      paymentType: trxData.paymentType,
      status: trxData.status,
      type: "Withdraw rejected",
      description: "Withdraw rejected",
    });

    return res
      .status(200)
      .json({ success: true, message: "Withdraw successfully rejected" });
  } catch (err) {
    console.log("cojinwithdra reject passbook error", err);
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

/**
 * Approve Fiat Withdraw
 * URL: /adminapi/coinWithdraw/approve
 * METHOD : POST
 * BODY: transactionId
 */
export const fiatWithdrawApprove = async (req, res) => {
  try {
    let reqParam = req.params;

    let trxData = await Transaction.findOneAndUpdate(
      {
        _id: reqParam.transactionId,
        paymentType: "fiat_withdraw",
        status: "pending",
      },
      {
        status: "completed",
      },
      { new: true }
    )
      .populate("currencyId")
      .populate("userId");

    if (!trxData) {
      return res.status(400).json({ success: false, message: "Invalid Token" });
    }

    let content = {
      amount: trxData.actualAmount,
      currency: trxData.currencyId && trxData.currencyId.currencySymbol,
      tranactionId: reqParam.transactionId,
      date: new Date(),
    };

    mailTemplateLang({
      userId: trxData.userId._id,
      identifier: "Withdraw_notification",
      toEmail: trxData.userId.email,
      content,
    });

    newNotification({
      userId: trxData.userId,
      currencyId: trxData.currencyId,
      transactionId: trxData._id,
      trxId: trxData._id,
      currencySymbol: trxData.currencySymbol,
      amount: trxData.amount,
      paymentType: trxData.paymentType,
      status: trxData.status,
      type: "Withdraw successfully",
      description: "Withdraw successfully",
    });

    return res
      .status(200)
      .json({ success: true, message: "Withdraw successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

/**
 * Reject Coin Withdraw
 * URL: /adminapi/coinWithdraw/reject
 * METHOD : POST
 */
export const fiatWithdrawReject = async (req, res) => {
  try {
    let reqParam = req.params;

    let trxData = await Transaction.findOneAndUpdate(
      {
        _id: reqParam.transactionId,
        paymentType: "fiat_withdraw",
        status: "pending",
      },
      {
        status: "rejected",
        message: reqParam.message
      },
      { new: true }
    );

    if (!trxData) {
      return res.status(400).json({ success: false, message: "Invalid Token" });
    }

    let usrAsset = await Assets.findOne({
      userId: trxData.userId,
      currency: trxData.currencyId,
    });
    let beforeBalance = parseFloat(usrAsset.spotwallet);
    usrAsset.spotwallet =
      parseFloat(usrAsset.spotwallet) + parseFloat(trxData.amount);
    let userAssetData = await usrAsset.save();

    console.log("dddddddddd-1193", userAssetData);

    //New passbook
    let passbookData = {};
    passbookData.userId = userAssetData.userId;
    passbookData.coin = userAssetData.currencySymbol;
    passbookData.currencyId = userAssetData.currency;
    passbookData.tableId = userAssetData._id;
    passbookData.beforeBalance = beforeBalance;
    passbookData.afterBalance = userAssetData.spotwallet;
    passbookData.amount = trxData.amount;
    passbookData.type = "Withdraw reject";
    passbookData.category = "debit";
    createPassBook(passbookData);

    let userEmail = await User.findById({ _id: trxData.userId }, { email: 1 }).lean()
    let content = {
      amount: trxData.actualAmount,
      currency: trxData.currencySymbol,
      reason: reqParam.message,
      date: new Date(),
    };
    if (userEmail)
      mailTemplateLang({
        userId: trxData.userId,
        identifier: "User_Withdraw_Request_reject",
        toEmail: userEmail && userEmail.email,
        content,
      });

    //End
    newNotification({
      userId: trxData.userId,
      currencyId: trxData.currencyId,
      transactionId: trxData._id,
      trxId: trxData._id,
      currencySymbol: trxData.currencySymbol,
      amount: trxData.amount,
      paymentType: trxData.paymentType,
      status: trxData.status,
      type: "fiat_withdraw_rejected",
      description: "Withdraw rejected",
    });
    return res
      .status(200)
      .json({ success: true, message: "Withdraw successfully rejected" });
  } catch (err) {
    console.log(err, "------1244");
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

/**
 * Admin Approved Fiat Deposit Request
 * URL: /adminapi/fiatDeposit/approve
 * METHOD : POST
 * BODY : transactionId, amount
 */
export const fiatDepositApprove = async (req, res) => {
  try {
    let reqBody = req.body;
    let transactionData = await Transaction.findOneAndUpdate(
      {
        _id: reqBody.transactionId,
        paymentType: "fiat_deposit",
        status: "pending",
      },
      {
        status: "completed",
        actualAmount: reqBody.amount,
      },
      { new: true }
    ).populate("userId");

    if (!transactionData) {
      return res.status(400).json({ success: false, message: "Invalid Token" });
    }

    // let priceCalculate = commissionFeeCalculate(transactionData.actualAmount, reqBody.amount)
    let userData = await Assets.findOne({ _id: transactionData.userAssetId });
    let beforeBal = userData.spotwallet;
    userData.spotwallet = userData.spotwallet + parseInt(reqBody.amount);
    let userAsset = await userData.save();

    console.log(userAsset, "--------1377");
    //New passbook
    let passbookData = {};
    passbookData.userId = userAsset.userId;
    passbookData.coin = userAsset.currencySymbol;
    passbookData.currencyId = userAsset.currency;
    passbookData.tableId = userAsset._id;
    passbookData.beforeBalance = beforeBal;
    passbookData.afterBalance = userAsset.spotwallet;
    passbookData.amount = reqBody.amount;
    passbookData.type = "fiat_deposit_approved";
    passbookData.category = "credit";
    createPassBook(passbookData);

    let content = {
      amount: reqBody.amount,
      currency: transactionData.currencySymbol,
      transactionId: transactionData._id,
      date: new Date(),
    };

    newNotification({
      userId: transactionData.userId,
      currencyId: transactionData.currencyId,
      transactionId: transactionData._id,
      trxId: transactionData._id,
      currencySymbol: transactionData.currencySymbol,
      amount: transactionData.amount,
      paymentType: transactionData.paymentType,
      status: transactionData.status,
      type: "Deposit successfully",
      description: "Deposit successfully",
    });

    // Referralcommission(
    //   transactionData.currencySymbol,
    //   transactionData.amount,
    //   transactionData.userId
    // );
    mailTemplateLang({
      userId: transactionData.userId && transactionData.userId._id,
      identifier: "User_deposit",
      toEmail: transactionData.userId && transactionData.userId.email,
      content,
    });
    return res
      .status(200)
      .json({ success: false, message: "Amount added successfully" });
  } catch (err) {
    console.log("aaaaaaaaaaaaaaaaaaaaa", err);
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};
export const fiatDepositReject = async (req, res) => {
  try {
    let reqBody = req.body;
    let transactionData = await Transaction.findOneAndUpdate(
      {
        _id: reqBody.transactionId,
        paymentType: "fiat_deposit",
        status: "pending",
      },
      {
        status: "rejected",
        message: reqBody.message,
      },
      { new: true }
    ).populate("userId");

    if (!transactionData) {
      return res.status(400).json({ success: false, message: "Invalid Token" });
    }
    console.log(
      "transactionDatatransactionDatatransactionDatatransactionData",
      transactionData
    );
    // let priceCalculate = commissionFeeCalculate(transactionData.actualAmount, reqBody.amount)
    // await Assets.findOneAndUpdate(
    //   { _id: transactionData.userAssetId },
    //   {
    //     $inc: {
    //       spotwallet: reqBody.amount,
    //     },
    //   },
    //   { new: true }
    // );

    let content = {
      amount: transactionData.amount,
      currency: transactionData.currencySymbol,
      message: reqBody.message,
      date: new Date(),
    };

    mailTemplateLang({
      userId: transactionData.userId && transactionData.userId._id,
      identifier: "User_deposit_reject",
      toEmail: transactionData.userId && transactionData.userId.email,
      content,
    });

    newNotification({
      userId: transactionData.userId,
      currencyId: transactionData.currencyId,
      transactionId: transactionData._id,
      trxId: transactionData._id,
      currencySymbol: transactionData.currencySymbol,
      amount: transactionData.amount,
      paymentType: transactionData.paymentType,
      status: transactionData.status,
      type: "Deposit rejected",
      description: "Deposit rejected",
    });

    return res
      .status(200)
      .json({ success: false, message: "Deposit rejected successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

/**
 * Get Deposit List
 * URL : /adminapi/depositList
 * METHOD : GET
 */
export const getDepositList = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let filter = filterSearchQuery(req.query, [
      "email",
      "toaddress",
      "currencySymbol",
      "amount",
      "txid",
      "status",
    ]);

    let count = await Transaction.aggregate([
      {
        $match: {
          paymentType: { $in: ["coin_deposit", "fiat_deposit"] },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          email: "$userInfo.email",
          currencySymbol: 1,
          userAssetId: 1,
          actualAmount: 1,
          amount: 1,
          txid: 1,
          toaddress: 1,
          status: 1,
          paymentType: 1,
          createdAt: {
            $dateToString: {
              date: "$createdAt",
              format: "%Y-%m-%d %H:%M",
            },
          },
        },
      },
      { $match: filter },
    ]);

    let data = await Transaction.aggregate([
      {
        $match: {
          paymentType: { $in: ["coin_deposit", "fiat_deposit"] },
        },
      },
      { $sort: { createdAt: -1 } },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          email: "$userInfo.email",
          currencySymbol: 1,
          userAssetId: 1,
          image: {
            $concat: [
              config.SERVER_URL,
              config.IMAGE.DEPOSIT_URL_PATH,
              "$image",
            ],
          },
          actualAmount: 1,
          amount: 1,
          txid: 1,
          toaddress: 1,
          status: 1,
          paymentType: 1,
          createdAt: {
            $dateToString: {
              date: "$createdAt",
              format: "%Y-%m-%d %H:%M",
            },
          },
        },
      },
      { $match: filter },
      { $skip: pagination.skip },
      { $limit: pagination.limit },
    ]);

    let result = {
      data,
      count: count.length,
    };
    return res.status(200).json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

/**
 * Get User Deposit
 * URL: /api/get-user-deposit
 * METHOD : POST
 */
export const getuserDeposit = async (req, res) => {
  try {
    let userId = req.user.id;
    await deposit(userId);

    let currecnytable = await Currency.find({ type: "token", gateWay: "ERC" });

    let lengthofetc20currecny = currecnytable.length;
    for (let i = 0; i < lengthofetc20currecny; i++) {
      await ERC20_Deposit(userId, currecnytable[i].currencySymbol);
    }
    return;
  } catch (err) {
    console.log(err, "----err");
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

//bulkdeposit post

export const bulkDeposit = async (req, res) => {
  try {
    let bulkdepositlist = req.body.depostlist;
    let total = req.body.depostlist.length;
    let status = [];

    for (let i = 0; i < total; i++) {
      let obj = {};
      obj["email"] = bulkdepositlist[i].email;
      obj["currencySymbol"] = bulkdepositlist[i].currencySymbol;
      obj["amount"] = bulkdepositlist[i].amount;

      if (isEmpty(bulkdepositlist[i].email)) {
        obj["Stauts"] = "Failed Please Enter Email";
      } else {
        let finduser = await User.find({ email: bulkdepositlist[i].email });
        if (!isEmpty(finduser)) {
          console.log("finduserfinduserfinduserfinduserfinduser", finduser);
          if (isEmpty(bulkdepositlist[i].currencySymbol)) {
            obj["Stauts"] = "Failed Please Enter currencySymbol";
          } else {
            let userAssetData = await Assets.findOne({
              userId: finduser[0]._id,
              currencySymbol: bulkdepositlist[i].currencySymbol,
            }).populate("currency");
            let balance = userAssetData.spotwallet;
            console.log("ddddd1559", userAssetData);
            if (!userAssetData) {
              obj["Stauts"] = "Failed Please Enter Valid currencySymbol";
            } else {
              if (bulkdepositlist[i].amount <= 0) {
                obj["Stauts"] = "Failed Please Enter Valid amount";
              } else {
                await Assets.update(
                  {
                    userId: finduser[0]._id,
                    currencySymbol: userAssetData.currencySymbol,
                  },
                  {
                    $inc: {
                      spotwallet: bulkdepositlist[i].amount,
                    },
                  }
                );
                obj["Stauts"] = "Compledted";
                let newDoc = new Transaction({
                  userId: finduser[0]._id,
                  currencyId: userAssetData.currency,
                  actualAmount: bulkdepositlist[i].amount,
                  amount: bulkdepositlist[i].amount,
                  currencySymbol: userAssetData.currencySymbol,
                  status: "completed",
                  paymentType: "fiat_deposit",

                  // commissionFee: userAsset.currency.depositCharge,
                  userAssetId: userAssetData._id,
                });

                let updateTrxData = await newDoc.save();
                console.log("userAsssssssssssssss", userAssetData);
                //New passbook
                let passbookData = {};
                passbookData.userId = userAssetData.userId;
                passbookData.coin = userAssetData.currencySymbol;
                passbookData.currencyId = userAssetData.currency;
                passbookData.tableId = userAssetData._id;
                passbookData.beforeBalance = balance;
                passbookData.afterBalance = userAssetData.spotwallet;
                passbookData.amount = newDoc.amount;
                passbookData.type = "Bulk Deposit";
                passbookData.category = "credit";
                createPassBook(passbookData);

                //End

                newNotification({
                  userId: updateTrxData.userId,
                  currencyId: updateTrxData.currencyId,
                  transactionId: updateTrxData._id,
                  trxId: updateTrxData._id,
                  currencySymbol: updateTrxData.currencySymbol,
                  amount: updateTrxData.amount,
                  paymentType: updateTrxData.paymentType,
                  status: updateTrxData.status,
                  type: "Deposit",
                  description: "Deposit successfully",
                });
              }
            }
          }
        } else {
          obj["Stauts"] = "Email not fount---deposit Failed";
        }
      }
      status.push(obj);
    }

    const csv = new ObjectsToCsv(status);
    let filename = new Date() + ".csv";
    await csv.toDisk("./public/bulkdeposit/" + filename);
    console.log("resultttttttt", status);
    var filePath = "./public/bulkdeposit/"; // Or format the path using the `id` rest param
    var sendfile = filename; // The default name the browser will use

    // res.download(filePath, sendfile);
    let sendfiletoadmin = config.SERVER_URL + "/bulkdeposit/" + sendfile;
    return res.status(200).json({
      success: true,
      message: "Bulk Deposit Success",
      file: sendfiletoadmin,
    });
  } catch (err) {
    console.log("errrrrrrrrrrrrrrrrrrr", err);
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

/**
 * Get Withdraw List
 * URL : /adminapi/downloadWithdrawListCsvFile
 * METHOD : GET
 */
export const downloadWithdrawListCsvFile = async (req, res) => {
  try {
    let data = await Transaction.aggregate([
      {
        $match: {
          paymentType: { $in: ["coin_withdraw", "fiat_withdraw"] },
          status: { $in: ["pending"] },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          email: "$userInfo.email",
          phoneNo: "$userInfo.phoneNo",
          currencySymbol: 1,
          amount: 1,
          actualAmount: 1,
          commissionFee: 1,
          bankDetail: 1,
          txid: 1,
          toaddress: 1,
          status: 1,
          paymentType: 1,
          createdAt: {
            $dateToString: {
              date: "$createdAt",
              format: "%Y-%m-%d %H:%M",
            },
          },
          action: "",
        },
      },
    ]);

    let csv = new ObjectsToCsv(data);
    let filename = new Date() + ".csv";
    await csv.toDisk("./public/bulkdeposit/" + filename);

    var filePath = "./public/bulkdeposit/"; // Or format the path using the `id` rest param
    var sendfile = filename; // The default name the browser will use

    // res.download(filePath, sendfile);
    let sendfiletoadmin = config.SERVER_URL + "/bulkdeposit/" + sendfile;

    return res.status(200).json({
      success: true,
      message: "Withdraw request list",
      file: sendfiletoadmin,
    });
  } catch (err) {
    console.log(err, "errerrerronbulkwithdraw");
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

export const bulkWithhdraw = async (req, res) => {
  try {
    let bulkWithhdrawList = req.body.bulkWithhdrawList;
    let total = req.body.bulkWithhdrawList.length;
    let status = [];

    for (let i = 0; i < total; i++) {
      let obj = {};
      obj = bulkWithhdrawList[i];
      if (bulkWithhdrawList[i].action == "reject") {
        console.log("rejectrejectrejectrejectreject");
        if (bulkWithhdrawList[i].paymentType == "fiat_withdraw") {
          console.log(
            "fiat_withdrawfiat_withdraw",
            JSON.parse(bulkWithhdrawList[i]._id)
          );
          let trxData = await Transaction.findOneAndUpdate(
            {
              _id: ObjectId(JSON.parse(bulkWithhdrawList[i]._id)),
              paymentType: bulkWithhdrawList[i].paymentType,
              status: bulkWithhdrawList[i].status,
              amount: bulkWithhdrawList[i].amount,
            },
            {
              status: "rejected",
            },
            { new: true }
          );

          if (!trxData) {
            obj["Status"] =
              "Failed withdraw due to Changes in some datas,please don'y change any filed..";
            status.push(obj);
          } else {
            let userAssetData = await Assets.findOneAndUpdate(
              {
                userId: trxData.userId,
                currency: trxData.currencyId,
              },
              {
                $inc: {
                  spotwallet: trxData.amount,
                },
              }
            );

            obj["Status"] = "Completed";
            status.push(obj);

            let balance = userAssetData.spotwallet;
            console.log("1802======userAssetData", userAssetData);
            //New passbook
            let passbookData = {};
            passbookData.userId = userAssetData.userId;
            passbookData.coin = userAssetData.currencySymbol;
            passbookData.currencyId = userAssetData.currency;
            passbookData.tableId = userAssetData._id;
            passbookData.beforeBalance = balance;
            passbookData.afterBalance = userAssetData.spotwallet;
            passbookData.amount = trxData.amount;
            passbookData.type = "Bulk Fiat Withdraw";
            passbookData.category = "credit";
            createPassBook(passbookData);
          }
        } else {
          if (bulkWithhdrawList[i].paymentType == "coin_withdraw") {
            let trxData = await Transaction.findOneAndUpdate(
              {
                _id: ObjectId(JSON.parse(bulkWithhdrawList[i]._id)),
                paymentType: bulkWithhdrawList[i].paymentType,
                status: bulkWithhdrawList[i].status,
                amount: bulkWithhdrawList[i].amount,
              },
              {
                status: "rejected",
              },
              { new: true }
            );

            if (!trxData) {
              obj["Status"] =
                "Failed withdraw due to Changes in some datas,please don'y change any filed..";
              status.push(obj);
            } else {
              console.log(
                "trxDatatrxDatatrxDatatrxDatatrxDatatrxDatatrxDatatrxData",
                trxData
              );
              let userAssetData = await Assets.findOneAndUpdate(
                {
                  userId: trxData.userId,
                  currency: trxData.currencyId,
                },
                {
                  $inc: {
                    spotwallet: trxData.amount,
                  },
                }
              );

              //End
              obj["Status"] = "Completed";
              status.push(obj);

              let balance = userAssetData.spotwallet;
              console.log("1802======userAssetData", userAssetData);
              //New passbook
              let passbookData = {};
              passbookData.userId = userAssetData.userId;
              passbookData.coin = userAssetData.currencySymbol;
              passbookData.currencyId = userAssetData.currency;
              passbookData.tableId = userAssetData._id;
              passbookData.beforeBalance = balance;
              passbookData.afterBalance = userAssetData.spotwallet;
              passbookData.amount = trxData.amount;
              passbookData.type = "Bulk Coin Withdraw";
              passbookData.category = "credit";
              createPassBook(passbookData);
            }
          } else {
            obj["Status"] =
              "Failed withdraw due to Changes in some datas,please don'y change any filed..";
            status.push(obj);
          }
        }
      } else {
        if (bulkWithhdrawList[i].action == "accept") {
          if (bulkWithhdrawList[i].paymentType == "coin_withdraw") {
            console.log(
              "bulkWithhdrawListbulkWithhdrawListbulkWithhdrawList",
              JSON.parse(bulkWithhdrawList[i]._id)
            );
            let trxData = await Transaction.findOneAndUpdate(
              {
                _id: ObjectId(JSON.parse(bulkWithhdrawList[i]._id)),
                paymentType: bulkWithhdrawList[i].paymentType,
                status: bulkWithhdrawList[i].status,
                amount: bulkWithhdrawList[i].amount,
              },
              {
                status: "completed",
              },
              { new: true }
            );

            if (!trxData) {
              obj["Status"] =
                "Failed withdraw due to Changes in some datas,please don'y change any filed..";
              status.push(obj);
            } else {
              let trxData = await Transaction.findOneAndUpdate(
                {
                  _id: ObjectId(JSON.parse(bulkWithhdrawList[i]._id)),
                  paymentType: bulkWithhdrawList[i].paymentType,
                  status: bulkWithhdrawList[i].status,
                  amount: bulkWithhdrawList[i].amount,
                },
                {
                  status: "completed",
                },
                { new: true }
              )
                .populate("currencyId")
                .populate("userId");

              if (!trxData) {
                obj["Status"] =
                  "Failed withdraw due to Changes in some datas,please don'y change any filed..";
                status.push(obj);
              }
              if (trxData.currencyId && trxData.currencyId.type == "crypto") {
                if (trxData.currencyId.currencySymbol == "ETH") {
                  const ethWithdraw = await coinpaymentGateway.createWithdrawal(
                    {
                      currencySymbol: trxData.currencyId.currencySymbol,
                      amount: trxData.actualAmount,
                      address: trxData.toaddress,
                    }
                  );

                  // const ethWithdraw = await ethGateway.amountMoveToUser({
                  //     'userAddress': trxData.toaddress,
                  //     'amount': trxData.amount,
                  // })

                  if (!ethWithdraw.status) {
                    // trxData.status = 'pending';
                    // await trxData.save();
                    obj["Status"] =
                      "Failed withdraw due to Changes in some datas,please don'y change any filed..";
                    status.push(obj);
                  }

                  trxData.txid = ethWithdraw.data.id;
                  // trxData.txid = ethWithdraw.trxId.transactionHash;
                  let updateTrxData = await trxData.save();

                  newNotification({
                    userId: updateTrxData.userId,
                    currencyId: updateTrxData.currencyId,
                    transactionId: updateTrxData._id,
                    trxId: updateTrxData._id,
                    currencySymbol: updateTrxData.currencySymbol,
                    amount: updateTrxData.amount,
                    paymentType: updateTrxData.paymentType,
                    status: updateTrxData.status,
                  });
                } else {
                  let FinalWIthdrawAmount =
                    trxData.actualAmount +
                    trxData.currencyId.CoinpaymetNetWorkFee;
                  const btcWithdraw = await coinpaymentGateway.createWithdrawal(
                    {
                      currencySymbol: trxData.currencyId.currencySymbol,
                      amount: FinalWIthdrawAmount,
                      address: trxData.toaddress,
                    }
                  );

                  // const btcWithdraw = await btcGateway.amountMoveToUser({
                  //     'userAddress': trxData.toaddress,
                  //     'amount': trxData.amount,
                  // })

                  if (!btcWithdraw.status) {
                    // trxData.status = 'pending';
                    // await trxData.save();
                    obj["Status"] =
                      "Failed withdraw due to Changes in some datas,please don'y change any filed..";
                    status.push(obj);
                  }

                  trxData.txid = btcWithdraw.data.id;
                  // trxData.txid = btcWithdraw.trxId;
                  let updateTrxData = await trxData.save();

                  newNotification({
                    userId: updateTrxData.userId,
                    currencyId: updateTrxData.currencyId,
                    transactionId: updateTrxData._id,
                    trxId: updateTrxData._id,
                    currencySymbol: updateTrxData.currencySymbol,
                    amount: updateTrxData.amount,
                    paymentType: updateTrxData.paymentType,
                    status: updateTrxData.status,
                  });
                }
              } else if (
                trxData.currencyId &&
                trxData.currencyId.type == "token"
              ) {
                if (trxData.currencyId.gateWay == "ERC") {
                  /* ETH Token */
                  const ethWithdraw = await ethGateway.tokenMoveToUser({
                    userAddress: trxData.toaddress,
                    amount: trxData.actualAmount,
                    minAbi: trxData.currencyId.minABI,
                    contractAddress: trxData.currencyId.contractAddress,
                  });
                  if (!ethWithdraw.status) {
                    // trxData.status = 'pending';
                    // await trxData.save();
                    obj["Status"] = "Completed";
                    status.push(obj);
                  }
                  trxData.txid = ethWithdraw.trxId;
                  let updateTrxData = await trxData.save();

                  newNotification({
                    userId: updateTrxData.userId,
                    currencyId: updateTrxData.currencyId,
                    transactionId: updateTrxData._id,
                    trxId: updateTrxData._id,
                    currencySymbol: updateTrxData.currencySymbol,
                    amount: updateTrxData.amount,
                    paymentType: updateTrxData.paymentType,
                    status: updateTrxData.status,
                  });

                  // return res.status(200).json({ 'success': true, 'result': { 'messages': "Success" } })
                } else {
                  if (trxData.currencyId.gateWay == "CoinPayment") {
                    let FinalWIthdrawAmount =
                      trxData.actualAmount +
                      trxData.currencyId.CoinpaymetNetWorkFee;
                    const btcWithdraw =
                      await coinpaymentGateway.createWithdrawal({
                        currencySymbol: trxData.currencyId.currencySymbol,
                        amount: FinalWIthdrawAmount,
                        address: trxData.toaddress,
                      });

                    // const btcWithdraw = await btcGateway.amountMoveToUser({
                    //     'userAddress': trxData.toaddress,
                    //     'amount': trxData.amount,
                    // })

                    if (!btcWithdraw.status) {
                      // trxData.status = 'pending';
                      // await trxData.save();
                      obj["Status"] =
                        "Failed withdraw due to Changes in some datas,please don'y change any filed..";
                      status.push(obj);
                    }

                    trxData.txid = btcWithdraw.data.id;
                    // trxData.txid = btcWithdraw.trxId;
                    let updateTrxData = await trxData.save();

                    newNotification({
                      userId: updateTrxData.userId,
                      currencyId: updateTrxData.currencyId,
                      transactionId: updateTrxData._id,
                      trxId: updateTrxData._id,
                      currencySymbol: updateTrxData.currencySymbol,
                      amount: updateTrxData.amount,
                      paymentType: updateTrxData.paymentType,
                      status: updateTrxData.status,
                    });
                  }
                }
              } else {
                obj["Status"] =
                  "Failed withdraw due to Changes in some datas,please don'y change any filed..";
                status.push(obj);
              }

              let content = {
                amount: trxData.actualAmount,
                currency:
                  trxData.currencyId && trxData.currencyId.currencySymbol,
                tranactionId: reqParam.transactionId,
                date: new Date(),
              };

              mailTemplateLang({
                userId: trxData.userId._id,
                identifier: "Withdraw_notification",
                toEmail: trxData.userId.email,
                content,
              });

              obj["Status"] = "Completed";
              status.push(obj);
            }
          }
          if (bulkWithhdrawList[i].paymentType == "fiat_withdraw") {
            let trxData = await Transaction.findOneAndUpdate(
              {
                _id: ObjectId(JSON.parse(bulkWithhdrawList[i]._id)),
                paymentType: bulkWithhdrawList[i].paymentType,
                status: bulkWithhdrawList[i].status,
                amount: bulkWithhdrawList[i].amount,
              },
              {
                status: "rejected",
              },
              { new: true }
            )
              .populate("currencyId")
              .populate("userId");

            if (!trxData) {
              obj["Status"] =
                "Failed withdraw due to Changes in some datas,please don'y change any filed..";
              status.push(obj);
            }

            let content = {
              amount: trxData.actualAmount,
              currency: trxData.currencyId && trxData.currencyId.currencySymbol,
              tranactionId: reqParam.transactionId,
              date: new Date(),
            };

            mailTemplateLang({
              userId: trxData.userId._id,
              identifier: "Withdraw_notification",
              toEmail: trxData.userId.email,
              content,
            });

            newNotification({
              userId: trxData.userId,
              currencyId: trxData.currencyId,
              transactionId: trxData._id,
              trxId: trxData._id,
              currencySymbol: trxData.currencySymbol,
              amount: trxData.amount,
              paymentType: trxData.paymentType,
              status: trxData.status,
            });

            obj["Status"] = "Completed";
            status.push(obj);
          } else {
            obj["Status"] =
              "Failed withdraw due to Changes in some datas,please don'y change any filed..";
            status.push(obj);
          }
        } else {
          obj["Status"] =
            "Failed withdraw due to Changes in some datas,please don'y change any filed..";
          status.push(obj);
        }
      }
    }
    console.log("itemitemitem", status);

    let csv = new ObjectsToCsv(status);
    let filename = new Date() + ".csv";
    await csv.toDisk("./public/bulkdeposit/" + filename);
    console.log("resultttttttt", status);

    var sendfile = filename;

    let sendfiletoadmin = config.SERVER_URL + "/bulkdeposit/" + sendfile;
    return res.status(200).json({
      success: true,
      message: "Bulk Deposit Success",
      file: sendfiletoadmin,
    });
  } catch (err) {
    console.log("errrrrrrrrrrrrrrrrrrr", err);
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};
