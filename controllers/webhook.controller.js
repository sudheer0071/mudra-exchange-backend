// import package
import fs from "fs";
import qs from 'querystring'
// import model

import { Currency, Transaction, Assets } from "../models";

// import controller
import { mailTemplateLang } from "./emailTemplate.controller";
import { createHmac } from '../lib/crypto';
import { Referralcommission } from "./referralcommission.controller";
import isEmpty from '../lib/isEmpty';
import config from '../config';
import { createPassBook } from "./passbook.controller";
export const generateSign = (secretKey, payload) => {
  let payloadString = qs.stringify(payload).replace(/%20/g, `+`);
  const signature = createHmac(`sha512`, secretKey)
  signature.update(payloadString)
  // console.log('payloadString',signature.digest('hex'))
  return signature.digest('hex');
}

export const verifySign = (req, res, next) => {
  try {
    console.log('reqbodyVerifySign', req.body)
    console.log('reqheadersVerifySign', req.headers)
    let reqBody = req.body;
    let header = req.headers;

    if (isEmpty(reqBody)) {
      console.log('0')

      return res.status(400).json({ 'success': false, 'message': 'MISSING_PAYLOAD' })
    }

    if (isEmpty(header['hmac'])) {
      console.log('1')
      return res.status(400).json({ 'success': false, 'message': 'MISSING_API_SIGNATURE' })
    }

    if (isEmpty(reqBody.ipn_mode)) {
      console.log('2')

      return res.status(400).json({ 'success': false, 'message': 'MISSING_IPN_MODE' })
    }

    if (reqBody.ipn_mode != 'hmac') {
      console.log('3')

      return res.status(400).json({ 'success': false, 'message': 'MISMATCH_IPN_MODE' })
    }

    if (isEmpty(reqBody.merchant)) {
      console.log('4')

      return res.status(400).json({ 'success': false, 'message': 'MISSING_MERCHANT' })
    }

    if (reqBody.merchant != config.coinpaymentGateway.MERCHANT_ID) {
      console.log('5')

      return res.status(400).json({ 'success': false, 'message': 'MISMATCH_MERCHANT_ID' })
    }

    let createSign = generateSign(config.coinpaymentGateway.IPN_SECRET, reqBody)

    if (createSign != header['hmac']) {
      console.log('6')

      return res.status(400).json({ 'success': false, 'message': 'MISMATCH_API_SIGNATURE' })
    }

    return next()
  } catch (err) {
    console.log('err', err)
    return res.status(500).json({ 'success': false, 'message': 'SOMETHING_WRONG' })
  }
}

function write_log(msg) {
  try {
    var now = new Date();
    var log_file =
      "log/common_log_" +
      now.getFullYear() +
      now.getMonth() +
      now.getDay() +
      ".txt";
    fs.appendFileSync(log_file, msg);
    //console.log(msg);
    return true;
  } catch (err) {
    console.log("err", err);
  }
}

/**
 * Coin Payment Deposit Webhook
 * URL: /api/depositwebhook
 * BODY : currency, address, txn_id, amount
 */
export const depositwebhook = async (req, res) => {
  write_log(JSON.stringify(req.body));
  write_log(JSON.stringify(req.headers));
  try {
    let reqBody = req.body;
    let currencyData = await Currency.findOne({
      currencySymbol: reqBody.currency,
    });
     console.log("Initiating depositwebhook",reqBody)
    if (!currencyData) {
      return res
        .status(400)
        .json({ success: false, messages: "Invalid currency" });
    }
    let userAssetData;
    if (currencyData.currencySymbol=="XRP") {
      userAssetData = await Assets.findOne({
        alt_tag:reqBody.dest_tag,
        currency: currencyData._id,
        currencySymbol: "XRP",
      }).populate({ path: "userId" });
    } else {
      userAssetData = await Assets.findOne({
        currency: currencyData._id,
        currencyAddress: reqBody.address,
      }).populate({ path: "userId" });
    }


    if (!userAssetData) {
      return res
        .status(400)
        .json({ success: false, messages: "Invalid assets" });
    }

    if (userAssetData && !userAssetData.userId) {
      return res
        .status(400)
        .json({ success: false, messages: "Invalid user data" });
    }

    let trxnData = await Transaction.findOne({
      currencyId: currencyData._id,
      txid: reqBody.txn_id,
    });

    if (trxnData) {
      return res
        .status(400)
        .json({ success: false, messages: "Already payment exists" });
    }

    let transactions = new Transaction();
    transactions["userId"] = userAssetData.userId._id;
    transactions["currencyId"] = currencyData._id;
    transactions["currencySymbol"] = currencyData.currencySymbol;
    transactions["toaddress"] = reqBody.address;
    transactions["amount"] = reqBody.amount;
    transactions["actualAmount"] = reqBody.amount;
    transactions["txid"] = reqBody.txn_id;
    transactions["status"] = "completed";
    transactions["paymentType"] = "coin_deposit";

    let tableId = await transactions.save();

    await Assets.findOneAndUpdate(
      { _id: userAssetData._id },
      { $inc: { spotwallet: parseFloat(reqBody.amount).toFixed(8) } }
    );

    Referralcommission(
      currencyData.currencySymbol,
      reqBody.amount,
      userAssetData.userId._id
    );

    let content = {
      email: userAssetData.userId.email,
      date: new Date(),
      amount: parseFloat(reqBody.amount).toFixed(8),
      transactionId: reqBody.txn_id,
      currency: reqBody.currency,
    };

    mailTemplateLang({
      userId: userAssetData.userId._id,
      identifier: "User_deposit",
      toEmail: userAssetData.userId.email,
      content,
    });


    createPassBook({
      userId: userAssetData.userId._id,
      userCodeId: userAssetData.userId.uniqueId,
      coin: currencyData.currencySymbol,
      currencyId: currencyData._id,
      tableId: tableId._id,
      beforeBalance: userAssetData.spotwallet,
      afterBalance: parseFloat(userAssetData.spotwallet + reqBody.amount),
      amount: parseFloat(reqBody.amount),
      type: "coin_deposit",
      category: "credit",
    });

    return res
      .status(200)
      .json({ success: true, messages: "Updated successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, messages: "Error on server" });
  }
};
