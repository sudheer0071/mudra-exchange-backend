// import package
import async from "async";
// import model
import { Airdrop, User, Assets, FeesOwnToken, ReferralFee, Currency, PriceConversion } from "../models";
import { paginationQuery, filterSearchQuery, searchQuery } from "../lib/adminHelpers";
import { createPassBook } from "./passbook.controller";
import mongoose from "mongoose";
import isEmpty from '../lib/isEmpty';
/**
 * Get Cms List
 * URL : /adminapi/cms
 * METHOD : GET
 */
const ObjectId = mongoose.Types.ObjectId;

export const getairdropList = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let filter = filterSearchQuery(req.query, ["email", "status"]);

    let search = {};
    let userSearch = {};
    let currecnySearch = {};
    if (req.query.search) {
      let userColSearch = [
        { name: "$email", type: "string" },
      ];
      userSearch = searchQuery(userColSearch, req.query.search);
      let airDropColSearch = [
        { name: "$tokenamount", type: "number" },
      ];
      search = searchQuery(airDropColSearch, req.query.search);

      let currecnyColSearch = [
        { name: "$currencySymbol", type: "string" },
        { name: "$currencyName", type: "string" },
      ];
      currecnySearch = searchQuery(currecnyColSearch, req.query.search);
    }


    async.parallel({
      user: function (callback) {
        User.find(userSearch, callback).distinct("_id");
      },
      currecny: function (callback) {
        Currency.find(currecnySearch, callback).distinct("_id");
      }
    }, async function (err, result) {

      if (req.query.search) {
        search["$expr"]["$or"].push({ $in: ["$userId", result.user] }, { $in: ["$currencyId", result.currecny] });
      }
      var totalCount = await Airdrop.countDocuments(search);

      Airdrop.find(search, {
      }).sort({ _id: -1 }).populate([{ path: "userId", select: { email: 1, phoneCode: 1, phoneNo: 1 } }, { path: "currencyId", select: { currencySymbol: 1, currencyName: 1 } }]).skip(pagination.skip).limit(pagination.limit).allowDiskUse(true)
        .exec(function (err, history) {
          if (err) {
            return res.status(400).json({ status: false, message: "Error occured" });
          } else {

            let result = {
              count: totalCount,
              data: history,
            };
            return res.status(200).json({ status: true, result });
          }
        });
    });

    // let count = await Airdrop.countDocuments(filter);
    // let data = await Airdrop.find(filter, {
    //   email: 1,
    //   status: 1,
    //   createdDate: 1,
    //   currencyId: 1,
    //   tokenamount: 1,
    // })
    //   .populate("currencyId")
    //   .sort({ _id: -1 })
    //   .skip(pagination.skip)
    //   .limit(pagination.limit);

    // let result = {
    //   count,
    //   data,
    // };
    // return res.status(200).json({ success: true, messages: "success", result });
  } catch (err) {
    console.log("airderoperrr", err);
    res.status(500).json({ success: false, message: "error on server" });
  }
};

/**
 * Update Cms List
 * URL : /adminapi/cms
 * METHOD : PUT
 * BODY : id, identifier, title, content
 */
export const airdropadd = async (req, res) => {
  try {
    let reqBody = req.body;

    //console.log("reqBodyreqBodyreqBody", req.body);
    let currecnyName = await Currency.findById(reqBody.currencyId.firstCurrencyId)
    let limitAmount = parseFloat(reqBody.tokenamount).toFixed(6);
    let limit = await PriceConversion.findOne({ baseSymbol: currecnyName.currencySymbol, "convertSymbol": "INR", })
    // console.log("limitlimitlimitlimit",limit,limit.convertPrice * limitAmount,limitAmount,limit.convertPrice);
    if (limit)
      if (limit.convertPrice * limitAmount > 10000) {
        return res
          .status(400)
          .json({ status: false, message: `Amount must not be greater than ${10000 / limit.convertPrice}` });
      }

    if (reqBody.email.length > 0) {
      for (let i = 0; i < reqBody.email.length; i++) {
        let checkUser = await User.findOne({ email: reqBody.email[i].value });

        if (checkUser) {
          const newair = new Airdrop({
            tokenamount: reqBody.tokenamount,
            email: reqBody.email[i].value,
            currencyId: reqBody.currencyId.firstCurrencyId,
            userId: checkUser._id,
            adminId: req.user.id
          });
          let checkAsset = await Assets.findOne({
            userId: checkUser._id,
            currency: reqBody.currencyId.firstCurrencyId,
          });

          if (checkAsset) {
            let saveData = await newair.save();
            let updateAsset = await Assets.findOneAndUpdate(
              {
                userId: checkUser._id,
                currency: reqBody.currencyId.firstCurrencyId,
              },
              {
                $inc: {
                  spotwallet: reqBody.tokenamount,
                },
              },
              { new: true }
            );
            console.log("upDateAsset--84", updateAsset);

            //New passbook
            let passbookData = {};
            passbookData.userId = checkAsset.userId;
            passbookData.coin = checkAsset.currencySymbol;
            passbookData.currencyId = checkAsset.currency;
            passbookData.tableId = saveData._id;
            passbookData.beforeBalance = checkAsset.spotwallet;
            passbookData.afterBalance = updateAsset.spotwallet;
            passbookData.amount = saveData.tokenamount;
            passbookData.type = "AIRDROP-ADD";
            passbookData.category = "credit";
            createPassBook(passbookData);
            //End
          }
        }
      }
    }

    return res
      .status(200)
      .json({ status: true, message: "Airdrop updated successfully" });
  } catch (err) {
    console.log("Error on cms", err);
    return res
      .status(500)
      .json({ status: false, message: "Something went wrong" });
  }
};

export const addfeesowntoken = async (req, res) => {
  try {
    let reqBody = req.body, errors = {};

    if (isEmpty(reqBody.tokenamount))
      errors.tokenamount = "Token Name field is required";
    else if (isNaN(reqBody.tokenamount))
      errors.tokenamount = "Only numbers allowed";
    else if (reqBody.tokenamount <= 0)
      errors.tokenamount = "Token amount must be greater than zero";

    if (isEmpty(reqBody.currencyId))
      errors.firstCurrencyId = "Please select token";

    if (!isEmpty(errors)) {
      return res.status(400).json({ 'status': false, 'errors': errors });
    }

    console.log("reqBodyreqBodyreqBody", req.body);

    await FeesOwnToken.findOneAndUpdate(
      {},
      {
        $set: {
          percentage: reqBody.tokenamount,
          currencyId: reqBody.currencyId,
        },
      },

      { new: true }
    );

    // const newair = new FeesOwnToken({
    //   percentage: reqBody.tokenamount,
    //   currencyId: reqBody.currencyId.firstCurrencyId,
    // });

    // let saveData = await newair.save();

    return res
      .status(200)
      .json({ status: true, message: "Fees added successfully" });
  } catch (err) {
    console.log("Error on cms", err);
    return res
      .status(500)
      .json({ status: false, message: "Something went wrong" });
  }
};

export const getownfees = async (req, res) => {
  try {
    let data = await FeesOwnToken.findOne(
      {},
      {
        status: 1,
        createdDate: 1,
        currencyId: 1,
        percentage: 1,
      }
    )
      // .populate("currencyId")
      .sort({ _id: -1 });
    let result = {
      data,
    };
    return res.status(200).json({ success: true, messages: "success", result });
  } catch (err) {
    res.status(500).json({ success: false, message: "error on server" });
  }
};

export const savereferral = async (req, res) => {
  try {
    let reqBody = req.body;



    await ReferralFee.findOneAndUpdate(
      {},
      {
        $set: {
          percentage: reqBody.percentage,
          usdtamount: reqBody.usdtamount,
          currencyId: reqBody.currencyId.firstCurrencyId_ref,
        },
      },

      { new: true }
    );

    // const newair = new FeesOwnToken({
    //   percentage: reqBody.tokenamount,
    //   currencyId: reqBody.currencyId.firstCurrencyId,
    // });

    // let saveData = await newair.save();

    return res
      .status(200)
      .json({ status: true, message: "Fees Updated successfully" });
  } catch (err) {
    console.log("Error on cms", err);
    return res
      .status(500)
      .json({ status: false, message: "Something went wrong" });
  }
};

export const getrefrralfees = async (req, res) => {
  try {
    let data = await ReferralFee.findOne(
      {},
      {
        status: 1,
        createdDate: 1,
        currencyId: 1,
        percentage: 1,
        usdtamount: 1,
      }
    )
      .populate("currencyId")
      .sort({ _id: -1 });
    let result = {
      data,
    };
    return res.status(200).json({ success: true, messages: "success", result });
  } catch (err) {
    res.status(500).json({ success: false, message: "error on server" });
  }
};

export const MygetairdropList = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let filter = filterSearchQuery(req.query, ["currencySymbol", "status"]);
    filter["userId"] = req.user.id;
    let count = await Airdrop.countDocuments(filter);
    let data = await Airdrop.find(filter, {
      email: 1,
      status: 1,
      createdDate: 1,
      currencyId: 1,
      tokenamount: 1,
    })
      .populate("currencyId")
      .sort({ _id: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);
    let result = {
      count,
      data,
    };
    return res.status(200).json({ success: true, messages: "success", result });
  } catch (err) {
    console.log("airdrop get my cerrrr", err);
    res.status(500).json({ success: false, message: "error on server" });
  }
};

/**
 * Update Cms List
 * URL : /adminapi/cms
 * METHOD : PUT
 * BODY : id, identifier, title, content
 */
