//import packages
import multer from "multer";
import mongoose from "mongoose";
import CryptoJS from "crypto-js";
import { newNotification } from "./notification.controller";
//import config
import config from "../config";

//import controller
import { createAssetAtAddCurrency } from "./assets.controller";

//import lib
import isEmpty from "../lib/isEmpty";

// Models
import {
  Launchpad,
  User,
  Assets,
  Currency,
  launchpadOrder,
  Transaction,
  Admin,
} from "../models";

import {
  getChecksumString,
  getResponseChecksumString,
  calculateChecksum,
} from "../lib/zaakpayconfig";

const ObjectId = mongoose.Types.ObjectId;
const crypto = require("crypto");

export const GetCalculateSum = async (req, res) => {
  var Reqbody = req.body;
  var checksumstring = await getChecksumString(Reqbody);
  var calculatedchecksum = await calculateChecksum(checksumstring);

  return res.status(200).json({
    success: true,
    checksumstring: checksumstring,
    calculatedchecksum: calculatedchecksum,
    url: config.returnUrl,
  });
};

export const InitialSave = async (req, res) => {
  let userData = await User.findOne({ _id: req.user.id });

  let currencyData = await Currency.findOne({
    currencySymbol: req.body.currency,
  });
  if (userData) {
    let newDoc = new Transaction({
      userId: req.user.id,
      currencyId: currencyData._id,
      currencySymbol: req.body.currency,
      amount: parseFloat(req.body.amount) / 100,
      status: "pending",
      paymentType: "fiat_deposit",
      ZaakpayOrderID: req.body.OrderId,
    });
    
    let adminDetail = await Admin.findOne({ role: "superadmin" });
    newNotification({
        adminId: adminDetail._id,
        viewType:'admin',
        type: "New Fiat Deposit request",
        description: "New Fiat Deposit request...",
        createdAt: new Date(),
      });
    await newDoc.save();
    return res.json({
      status: true,
      message: "Payment submitted Succesully",
    });
  } else {
    return res.json({
      status: false,
      message: "Error on server",
    });
  }
};

export const paymentDone = async (req, res) => {
  // console.log("*************PAYMENT CONFIRMED***************", req.body)

  try {
    var reqBody = req.body;

    console.log(reqBody, "zaakpay body");

    let Transactiondata = await Transaction.findOne({
      ZaakpayOrderID: req.body.orderId,
      status: "pending",
    });
console.log('transactionData1111111111111',Transactiondata)
    if (Transactiondata) {
      let userdata = await User.findOne({ _id: Transactiondata.userId });
      console.log('userdata======123',userdata)
      if (userdata) {
        let userAsset = await Assets.findOne({
          userId: userdata._id,
          currencySymbol: "INR",
        });
console.log('ddddddddddd,userAsset107',userAsset)
        if (userAsset) {
          console.log('userAssetInsideCondtion')
          var depamount = parseFloat(reqBody.amount) / 100;

          if (reqBody.responseCode == "100") {
            Transactiondata.CardID = req.body.cardId;
            Transactiondata.txid = req.body.pgTransId;
            Transactiondata.status = "completed";
            var transsave = Transactiondata.save();
            var amounttoadd = parseFloat(userAsset.spotwallet) + depamount;
            userAsset.spotwallet = amounttoadd;
            var assetupdate = await userAsset.save();
            res.redirect(config.zaakrespurl + "/?ps=success");
          } else {
            Transactiondata.status = "rejected";
            await Transactiondata.save();
            console.log(config.zaakrespurl, "zaakrespurlzaakrespurl"),
              res.redirect(config.zaakrespurl + "/?ps=cancel");
          }
        }
      }
    }
  } catch (err) {
    console.log("errr on zaakpay confirm ", err);
    res.redirect(config.zaakrespurl);
  }
};
