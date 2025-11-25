// import package
import multer from "multer";
import path from "path";

// import model
import { Currency, Admin, AdminLog } from "../models";
const SpotPairs = require("../models/spotpairs");
const siteSetting = require("../models/sitesetting");
const { generatePassword } = require("../lib/bcrypt");
const { encryptString } = require("../lib/cryptoJS");

// import config
import config from "../config";

// import controller
import { addPriceCNV } from "./priceCNV.controller";
import { bnbContactCheck } from "./coin/bnbGateway";


// import lib
import imageFilter from "../lib/imageFilter";
import {
  paginationQuery,
  filterQuery,
  filterProofQuery,
  filterSearchQuery,
} from "../lib/adminHelpers";
import isEmpty from "../lib/isEmpty";
import { createAssetAtAddCurrency } from "./assets.controller";

/**
 * Multer Image Uploade
 */
const currencyStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.IMAGE.CURRENCY_PATH);
  },

  // By default, multer removes file extensions so let's add them back
  filename: function (req, file, cb) {
    cb(null, "currency-" + Date.now() + path.extname(file.originalname));
  },
});

let currencyUpload = multer({
  storage: currencyStorage,
  onError: function (err, next) {
    next(err);
  },
  fileFilter: imageFilter,
  limits: { fileSize: config.IMAGE.CURRENCY_SIZE },
}).fields([{ name: "currencyImage", maxCount: 1 }]);

export const uploadCurrency = (req, res, next) => {
  currencyUpload(req, res, function (err) {
    if (!isEmpty(req.validationError)) {
      return res
        .status(400)
        .json({
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

export const getCurrency = (req, res) => {
  Currency.find(
    { status: "active" },
    {
      currencyName: 1,
      currencySymbol: 1,
      type: 1,
    },
    (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "SOMETHING_WRONG" });
      }
      return res
        .status(200)
        .json({ success: true, message: "FETCH_SUCCESS", result: data });
    }
  );
};

export const currencySelect = async (req, res) => {
  try {
    // let pagination = paginationQuery(req.query);
    // let filter = filterSearchQuery(req.query, ['currencyName', 'currencySymbol', 'type', 'status']);

    // let count = await currency.countDocuments(filter);
    let data = await Currency.find();

    let result = {
      //count,
      data,
      //imageUrl: `${keys.SERVER_URL}${keys.IMAGE.CURRENCY_URL_PATH}`
    };

    return res
      .status(200)
      .json({ success: true, message: "FETCH_SUCCESS", result });
  } catch (err) {
    console.log(err, "errrrrrrr");
    return res.status(500).json({ success: true, message: "SOMETHING_WRONG" });
  }
};

/**
 * Get All Currency List
 * URL : /adminapi/currency
 * METHOD : GET
 */
export const currencyList = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let filter = filterSearchQuery(req.query, [
      "currencyName",
      "currencySymbol",
      "type",
      "status",
    ]);

    let count = await Currency.countDocuments(filter);
    let data = await Currency.find(filter, {
      _id: 1,
      currencyName: 1,
      currencySymbol: 1,
      type: 1,
      withdrawFee: 1,
      minimumWithdraw: 1,
      currencyImage: 1,
      bankDetails: 1,
      tokenType: 1,
      minABI: 1,
      contractAddress: 1,
      decimals: 1,
      isPrimary: 1,
      depositFee: 1,
      status: 1,
      minimumdeposit: 1,
      withdrawLimit: 1,
      displaypriority: 1,
      gateWay: 1,
      CoinpaymetNetWorkFee: 1,
      withdrawFeeFlat: 1,
      withdrawFeeType: 1,
      burnFee: 1
    })
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);

    let result = {
      count,
      data,
      imageUrl: `${config.SERVER_URL}${config.IMAGE.CURRENCY_URL_PATH}`,
    };

    return res
      .status(200)
      .json({ success: true, message: "FETCH_SUCCESS", result });
  } catch (err) {
    return res.status(500).json({ success: true, message: "SOMETHING_WRONG" });
  }
};

export const currencyListFees = async (req, res) => {
  try {
    // let pagination = paginationQuery(req.query);
    // let filter = filterSearchQuery(req.query, ['currencyName', 'currencySymbol', 'type', 'status']);

    let count = await Currency.countDocuments();
    let data = await Currency.find({}).sort({ createdAt: -1 });

    let result = {
      count,
      data,
      imageUrl: `${config.SERVER_URL}${config.IMAGE.CURRENCY_URL_PATH}`,
    };

    return res
      .status(200)
      .json({ success: true, message: "FETCH_SUCCESS", result });
  } catch (err) {
    console.log("err", err);
    return res.status(500).json({ success: true, message: "SOMETHING_WRONG" });
  }
};
export const adminDetails = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let filter = filterSearchQuery(req.query, ["name", "email", "role"]);

    let count = await Admin.countDocuments(filter);
    let data = await Admin.find(filter, {})
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);
    // let data = await Admin.find({})
    let result = {
      count,
      data,
      imageUrl: `${config.SERVER_URL}${config.IMAGE.CURRENCY_URL_PATH}`,
    };
    return res
      .status(200)
      .json({ success: true, message: "FETCH_SUCCESS", result });
  } catch (err) {
    return res.status(500).json({ success: true, message: "SOMETHING_WRONG" });
  }
};

/**
 * Add Currency
 * URL : /adminapi/currency
 * METHOD : POST
 * BODY : currencyName, currencySymbol, currencyImage, contractAddress, minABI, decimals, bankName, accountNo, holderName, bankcode, country, withdrawFee, minimumWithdraw,
 */
export const addCurrency = async (req, res) => {
  console.log("inside add currencyyyyyyy////////////////")
  try {
    let reqBody = req.body,
      reqFile = req.files;
  console.log("req body ", reqBody)
    let checkCurrency = await Currency.findOne({
      $or: [
        { type: "crypto", currencySymbol: reqBody.currencySymbol },
        { type: "token", gateWay: reqBody.gateWay, currencySymbol: reqBody.currencySymbol },
      ],
    });
    if (checkCurrency) {
      return res
        .status(400)
        .json({
          success: false,
          errors: { currencySymbol: "Currency symbol already exists" },
        });
    }

    if (reqBody.type == "crypto") {
      const newDoc = new Currency({
        currencyName: reqBody.currencyName,
        currencySymbol: reqBody.currencySymbol,
        currencyImage: reqFile.currencyImage[0].filename,
        withdrawFee: reqBody.withdrawFee,
        minimumWithdraw: reqBody.minimumWithdraw,
        withdrawLimit: reqBody.withdrawLimit,
        gateWay: reqBody.gateWay,
        CoinpaymetNetWorkFee: reqBody.CoinpaymetNetWorkFee,
        minimumdeposit: reqBody.minimumdeposit,
        depositFee: reqBody.depositFee,
        type: reqBody.type,
        displaypriority: reqBody.displaypriority,
      }, { upsert: true, strict: false });

      let newData = await newDoc.save();
      await createAssetAtAddCurrency(newData);
      await addPriceCNV(newData);
      return res
        .status(200)
        .json({ success: true, message: "Crypto Currency added successfully" });
    } else if (reqBody.type == "token") {
      // let { status, result, error } = await bnbContactCheck({ contractAddress: reqBody.contractAddress, coin: reqBody.currencySymbol })
      // if (!status) return res
      //   .status(500)
      //   .json({ success: false, message: "Invalid contract address" });

      const newDoc = new Currency({
        currencyName: reqBody.currencyName,
        currencySymbol: reqBody.currencySymbol,
        currencyImage: reqFile.currencyImage[0].filename,
        contractAddress: reqBody.contractAddress,
        minABI: reqBody.minABI,
        decimals: reqBody.decimals,
        withdrawFee: reqBody.withdrawFee,
        minimumWithdraw: reqBody.minimumWithdraw,
        withdrawLimit: reqBody.withdrawLimit,
        gateWay: reqBody.gateWay,
        CoinpaymetNetWorkFee: reqBody.CoinpaymetNetWorkFee,
        type: reqBody.type,
        minimumdeposit: reqBody.minimumdeposit,
        depositFee: reqBody.depositFee,
        displaypriority: reqBody.displaypriority,
      }, { upsert: true, strict: false });
      let newData = await newDoc.save();
      await createAssetAtAddCurrency(newData);
      await addPriceCNV(newData);
      return res
        .status(200)
        .json({ success: true, message: "Token currency added successfully" });
    } else if (reqBody.type == "fiat") {
      const newDoc = new Currency({
        currencyName: reqBody.currencyName,
        currencySymbol: reqBody.currencySymbol,
        currencyImage: reqFile.currencyImage[0].filename,
        "bankDetails.bankName": reqBody.bankName,
        "bankDetails.accountNo": reqBody.accountNo,
        "bankDetails.holderName": reqBody.holderName,
        "bankDetails.bankcode": reqBody.bankcode,
        "bankDetails.country": reqBody.country,
        withdrawFee: reqBody.withdrawFee,
        withdrawLimit: reqBody.withdrawLimit,
        gateWay: reqBody.gateWay,
        CoinpaymetNetWorkFee: reqBody.CoinpaymetNetWorkFee,
        minimumWithdraw: reqBody.minimumWithdraw,
        displaypriority: reqBody.displaypriority,
        minimumdeposit: reqBody.minimumdeposit,
        depositFee: reqBody.depositFee,
        type: reqBody.type,
      });

      let newData = await newDoc.save();
      await createAssetAtAddCurrency(newData);
      await addPriceCNV(newData);
      return res
        .status(200)
        .json({ success: true, message: "Fiat Currency added successfully" });
    }
    return res
      .status(409)
      .json({ success: false, message: "Something went wrong" });
  } catch (err) {
    console.log("addcruneyErr", err);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

export const addAdmin = async (req, res) => {
  try {
    let reqBody = req.body;

    if (reqBody.email == "") {
      return res
        .status(400)
        .json({ success: false, message: "Please Enter Email" });
    }

    if (reqBody.role == "") {
      return res
        .status(400)
        .json({ success: false, message: "Please Select Role" });
    }

    let checkUser = await Admin.findOne({
      email: reqBody.email,
      status: "active",
    });

    if (checkUser) {
      return res
        .status(200)
        .json({ success: false, message: "Email already exists" });
    }

    let { passwordStatus, hash } = await generatePassword(reqBody.password);
    //let { statuseth, hasheth } = await generatePassword(reqBody.ethprivatekey);
    // console.log("reqbodyethpassword",hasheth);

    if (!passwordStatus) {
      return res
        .status(400)
        .json({ success: false, message: "Something went wrong" });
    }

    //console.log("reqbodyethpassword",hasheth);

    let newDoc = new Admin({
      role: reqBody.role,
      name: reqBody.name,
      email: reqBody.email.toLowerCase(),
      password: hash,
      // ethprivatekey: hasheth,
      User: reqBody.User,
      UserBalance: reqBody.UserBalance,
      Currency: reqBody.Currency,
      PriceConversation: reqBody.PriceConversation,
      SpotPair: reqBody.SpotPair,
      SideSetting: reqBody.SideSetting,
      FaqCategory: reqBody.FaqCategory,
      Faq: reqBody.Faq,
      SupportCategory: reqBody.SupportCategory,
      Support: reqBody.Support,
      EmailTemplate: reqBody.EmailTemplate,
      CmsPage: reqBody.CmsPage,
      Kyc: reqBody.Kyc,
      WithdrawList: reqBody.WithdrawList,
      DepositList: reqBody.DepositList,
      ContactUs: reqBody.ContactUs,
      Newsletter: reqBody.Newsletter,
      Announcement: reqBody.Announcement,
      Launchpad: reqBody.Launchpad,
      LaunchpadCms: reqBody.LaunchpadCms,
      Language: reqBody.Language,
      SpotOrderHistory: reqBody.SpotOrderHistory,
      SpotTradeHistory: reqBody.SpotTradeHistory,
      TradingBot: reqBody.TradingBot,
      BlogCategory: reqBody.BlogCategory,
      BlogArticle: reqBody.BlogArticle,
      Staking: reqBody.Staking,
      p2ppair: reqBody.p2ppair,
      priceconversion: reqBody.priceconversion,
      p2ptradehistory: reqBody.p2ptradehistory,
      p2pchathistory: reqBody.p2pchathistory,
      p2pdisputelist: reqBody.p2pdisputelist,
      p2pcommissionhistory: reqBody.p2pcommissionhistory,
      stackingorder: reqBody.stackingorder,
      stackingsettlement: reqBody.stackingsettlement,
      airdrop: reqBody.stackingsettlement,
      refferalcommisonhistory: reqBody.refferalcommisonhistory,
      feeandrefferal: reqBody.feeandrefferal,
      airdropHistory: reqBody.airdropHistory,
      deleteuserList: reqBody.deleteuserList,
    });
    let Logsss = await AdminLog.create({ userId: req.user.id,  after: newDoc, table: "new admin" })

    let data = await newDoc.save();

    // let payloadData = {
    //     "_id": data._id
    // }
    // let encryptToken = encryptString(data._id, true)

    // var superAdminid = ObjectId(req.user.id);

    // let superAdmin = await Admin.findOne({ "_id": ObjectId(superAdminid) });

    // let activity = new AdminActivity({
    //     adminid: superAdmin._id,
    //     email: superAdmin.email,
    //     name: reqBody.name,
    //     newadmin: reqBody.email,
    //     content: "New Admin Added on " + moment().format(" MMMM Do YYYY, h:mm:ss a"),
    //     status: "false",
    // })

    // let result = await activity.save()
    return res
      .status(200)
      .json({
        success: true,
        result: data,
        message: "Admin added successfully",
      });
  } catch (err) {
    console.log(err, "errrrrrrr");
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    let reqBody = req.body;
    console.log("reqBodyreqBodyreqBody", reqBody);
    let updateRecord = {
      role: reqBody.role,
      name: reqBody.name,
      email: reqBody.email.toLowerCase(),
      // ethprivatekey: hasheth,
      User: reqBody.User,
      UserBalance: reqBody.UserBalance,
      Currency: reqBody.Currency,
      PriceConversation: reqBody.PriceConversation,
      SpotPair: reqBody.SpotPair,
      SideSetting: reqBody.SideSetting,
      FaqCategory: reqBody.FaqCategory,
      Faq: reqBody.Faq,
      SupportCategory: reqBody.SupportCategory,
      Support: reqBody.Support,
      EmailTemplate: reqBody.EmailTemplate,
      CmsPage: reqBody.CmsPage,
      Kyc: reqBody.Kyc,
      WithdrawList: reqBody.WithdrawList,
      DepositList: reqBody.DepositList,
      ContactUs: reqBody.ContactUs,
      Newsletter: reqBody.Newsletter,
      Announcement: reqBody.Announcement,
      Launchpad: reqBody.Launchpad,
      LaunchpadCms: reqBody.LaunchpadCms,
      Language: reqBody.Language,
      SpotOrderHistory: reqBody.SpotOrderHistory,
      SpotTradeHistory: reqBody.SpotTradeHistory,
      TradingBot: reqBody.TradingBot,
      BlogCategory: reqBody.BlogCategory,
      BlogArticle: reqBody.BlogArticle,
      Staking: reqBody.Staking,
      p2ppair: reqBody.p2ppair,
      p2ptradehistory: reqBody.p2ptradehistory,
      p2pchathistory: reqBody.p2pchathistory,
      p2pdisputelist: reqBody.p2pdisputelist,
      p2pcommissionhistory: reqBody.p2pcommissionhistory,
      stackingorder: reqBody.stackingorder,
      stackingsettlement: reqBody.stackingsettlement,
      airdrop: reqBody.airdrop,
      refferalcommisonhistory: reqBody.refferalcommisonhistory,
      feeandrefferal: reqBody.feeandrefferal,
      airdropHistory: reqBody.airdropHistory,
      deleteuserList: reqBody.deleteuserList,

    };

    // console.log("Inside Edit----",req.body);
    // let reqBody = req.body;
    var data = await Admin.findOneAndUpdate(
      { _id: req.body._id },
      { $set: updateRecord },
      { new: true }
    );
    let Logsss = await AdminLog.create({ userId: req.user.id,before:reqBody, after: data, table: "admin update" })

    return res
      .status(200)
      .json({
        success: true,
        result: data,
        message: "Admin Updated successfully",
      });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    console.log(req.body, "---------------------------");
    let deleteData = await Admin.deleteOne({ _id: req.body._id });
    return res
      .status(200)
      .json({ success: true, message: "Admin successfully Removed" });
  } catch (err) {
    console.log(err, "errrrrrrr");
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

/**
 * Update Currency
 * URL : /adminapi/currency
 * METHOD : PUT
 * BODY : currencyId, currencyName, currencySymbol, currencyImage, contractAddress, minABI, decimals, bankName, accountNo, holderName, bankcode, country, withdrawFee, minimumWithdraw,
 */
export const updateCurrency = async (req, res) => {
  try {
    let reqBody = req.body,
      reqFile = req.files;

    let checkCurrency = await Currency.findOne({
      $or: [
        { type: "crypto", currencySymbol: reqBody.currencySymbol },
        { type: "token", gateWay: reqBody.gateWay, currencySymbol: reqBody.currencySymbol },
      ],
      _id: { $ne: reqBody.currencyId },
    });
    if (checkCurrency) {
      return res
        .status(400)
        .json({
          success: false,
          errors: { currencySymbol: "Currency symbol already exists" },
        });
    }

    if (reqBody.type == "crypto") {
      let currencyDoc = await Currency.findOne({ _id: reqBody.currencyId });
      let Logsss = await AdminLog.create({ userId: req.user.id, before: currencyDoc, after: reqBody, table: "currency" })
      currencyDoc.currencyName = reqBody.currencyName;
      currencyDoc.currencySymbol = reqBody.currencySymbol;
      currencyDoc.currencyImage =
        reqFile.currencyImage && reqFile.currencyImage[0]
          ? reqFile.currencyImage[0].filename
          : currencyDoc.currencyImage;
      currencyDoc.minimumWithdraw = reqBody.minimumWithdraw;
      currencyDoc.type = reqBody.type;
      currencyDoc.status = reqBody.status;
      currencyDoc.withdrawLimit = reqBody.withdrawLimit;
      currencyDoc.displaypriority = reqBody.displaypriority;
      currencyDoc.CoinpaymetNetWorkFee = reqBody.CoinpaymetNetWorkFee;
      currencyDoc.gateWay = reqBody.gateWay;
      currencyDoc.minimumdeposit = reqBody.minimumdeposit;
      currencyDoc.depositFee = reqBody.depositFee;
      currencyDoc.withdrawFeeType = reqBody.withdrawFeeType;
      if (reqBody.withdrawFeeType == "percentage")
        currencyDoc.withdrawFee = reqBody.withdrawFee;
      if (reqBody.withdrawFeeType == "flat")
        currencyDoc.withdrawFeeFlat = reqBody.withdrawFeeFlat;
      await currencyDoc.save();
      return res
        .status(200)
        .json({
          success: true,
          message: "Crypto Currency updated successfully",
        });
    } else if (reqBody.type == "token") {

      // let { status, result, error } = await bnbContactCheck({ contractAddress: reqBody.contractAddress, coin: reqBody.currencySymbol })
      // if (!status) return res
      //   .status(500)
      //   .json({ success: false, message: "Invalid contract address" });
      let currencyDoc = await Currency.findById(reqBody.currencyId);
      let Logsss = await AdminLog.create({ userId: req.user.id, before: currencyDoc, after: reqBody, table: "currency" })

      currencyDoc.currencyName = reqBody.currencyName;
      currencyDoc.currencySymbol = reqBody.currencySymbol;
      currencyDoc.currencyImage =
        reqFile.currencyImage && reqFile.currencyImage[0]
          ? reqFile.currencyImage[0].filename
          : currencyDoc.currencyImage;
      currencyDoc.contractAddress = reqBody.contractAddress;
      currencyDoc.minABI = reqBody.minABI;
      currencyDoc.decimals = reqBody.decimals;
      currencyDoc.minimumWithdraw = reqBody.minimumWithdraw;
      currencyDoc.type = reqBody.type;
      currencyDoc.withdrawLimit = reqBody.withdrawLimit;
      currencyDoc.status = reqBody.status;
      currencyDoc.displaypriority = reqBody.displaypriority;
      currencyDoc.CoinpaymetNetWorkFee = reqBody.CoinpaymetNetWorkFee;
      currencyDoc.gateWay = reqBody.gateWay;
      currencyDoc.minimumdeposit = reqBody.minimumdeposit;
      currencyDoc.depositFee = reqBody.depositFee;
      currencyDoc.withdrawFeeType = reqBody.withdrawFeeType;
      currencyDoc.burnFee = reqBody.burnFee;
      if (reqBody.withdrawFeeType == "percentage")
        currencyDoc.withdrawFee = reqBody.withdrawFee;
      if (reqBody.withdrawFeeType == "flat")
        currencyDoc.withdrawFeeFlat = reqBody.withdrawFeeFlat;
      await currencyDoc.save();
      return res
        .status(200)
        .json({
          success: true,
          message: "Token currency updated successfully",
        });
    } else if (reqBody.type == "fiat") {
      let currencyDoc = await Currency.findOne({ _id: reqBody.currencyId });
      let Logsss = await AdminLog.create({ userId: req.user.id, before: currencyDoc, after: reqBody, table: "currency" })

      currencyDoc.currencyName = reqBody.currencyName;
      currencyDoc.currencySymbol = reqBody.currencySymbol;
      currencyDoc.currencyImage =
        reqFile.currencyImage && reqFile.currencyImage[0]
          ? reqFile.currencyImage[0].filename
          : currencyDoc.currencyImage;
      currencyDoc.bankDetails.bankName = reqBody.bankName;
      currencyDoc.bankDetails.accountNo = reqBody.accountNo;
      currencyDoc.bankDetails.holderName = reqBody.holderName;
      currencyDoc.bankDetails.bankcode = reqBody.bankcode;
      currencyDoc.bankDetails.country = reqBody.country;
      currencyDoc.minimumWithdraw = reqBody.minimumWithdraw;
      currencyDoc.type = reqBody.type;
      currencyDoc.withdrawLimit = reqBody.withdrawLimit;
      currencyDoc.status = reqBody.status;
      currencyDoc.displaypriority = reqBody.displaypriority;
      currencyDoc.CoinpaymetNetWorkFee = reqBody.CoinpaymetNetWorkFee;
      currencyDoc.gateWay = reqBody.gateWay;
      currencyDoc.minimumdeposit = reqBody.minimumdeposit;
      currencyDoc.depositFee = reqBody.depositFee;
      currencyDoc.withdrawFeeType = reqBody.withdrawFeeType;
      if (reqBody.withdrawFeeType == "percentage")
        currencyDoc.withdrawFee = reqBody.withdrawFee;
      if (reqBody.withdrawFeeType == "flat")
        currencyDoc.withdrawFeeFlat = reqBody.withdrawFeeFlat;
      await currencyDoc.save();
      return res
        .status(200)
        .json({ success: true, message: "Fiat Currency updated successfully" });
    }
    return res
      .status(409)
      .json({ success: false, message: "Something went wrong" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

export const deleteCurrency = async (req, res) => {
  try {
    let spotPairData = await SpotPairs.findOne({
      $or: [
        { firstCurrencyId: req.params.currencyId },
        { secondCurrencyId: req.params.currencyId },
      ],
    });
    if (spotPairData) {
      return res
        .status(500)
        .json({ success: false, errors: { messages: "Currently working" } });
    }

    await currency.deleteOne({ _id: req.params.currencyId });
    return res
      .status(200)
      .json({
        result: {
          messages: "Currency deleted sucessfully. Refreshing data...",
        },
      });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

/**
 * Edit Currency
 * URL : /adminapi/currency
 * METHOD: PUT
 *  BODY : currencyId, currencyType, currencyName, currencySymbol, withdrawFee, minabi, contractAddress, bankName, name, accountNo, routingNo, photo
 */

/**
 * Get Language Dropdown
 * URL : /adminapi/getLanguage
 * METHOD : GET
 */
export const getLanguage = async (req, res) => {
  Language.find(
    { status: "active" },
    { _id: 1, code: 1, name: 1, isPrimary: 1, status: 1 },
    (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Something went wrong" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Fetch successfully", result: data });
    }
  );
};
