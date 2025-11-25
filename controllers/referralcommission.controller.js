// import package
import mongoose from "mongoose";
// import modal
import {
  PriceConversion,
  User,
  Transaction,
  ReferralFee,
  ReferralCommission,
  Currency,
  Assets,
} from "../models";

// import config
import config from "../config";
import isEmpty from "../lib/isEmpty";
import { COINMARKETCAP } from "../config/cron";
import axios from "axios";
const ObjectId = mongoose.Types.ObjectId;

const rp = require("request-promise");
COINMARKETCAP.start();

/**
 * Sent Email
 * URL: /api/getEmailId
 * METHOD : GET
 * BODY : identifier, Subject (object)userId
 */

export const Referralcommission = async (currencySymbol, amount, userId) => {
  console.log("refe krishna......");
  try {
    let respData = await Currency.findOne({
      currencySymbol: currencySymbol,
    });
    // console.log(respData,"------------>respData")
    if (respData) {
      const usdtamount = respData.usdtamount;
      var convert_usdtprice = amount * usdtamount;
      // console.log(convert_usdtprice, "convert_usdtprice");

      let userdetails = await User.findOne({ _id: userId });
      // console.log(userdetails,"------------>userdetails")
      if (!isEmpty(userdetails.referaluserid)) {
        let referer_userdetails = await User.findOne({
          _id: userdetails.referaluserid,
        });
        let checktransaction = await Transaction.find({
          userId: userId,
          paymentType: "crypto_deposit",
        });
        if (checktransaction.length == 0) {
          let referralfee = await ReferralFee.findOne({});
          let currency = await Currency.findOne({
            _id: referralfee.currencyId,
          });
          var percentage = referralfee.percentage;
          var usdtprice = referralfee.usdtamount;
          var totalprice = convert_usdtprice * usdtprice;
          let feeeee=( percentage / 100)
          var token_amount = totalprice *feeeee
console.log("token_amounttoken_amount",token_amount,feeeee,totalprice,usdtprice,percentage,convert_usdtprice , amount ,usdtamount)
          let checkAsset = await Assets.findOne({
            currencySymbol: currency.currencySymbol,
            userId: referer_userdetails._id,
          });

          if (checkAsset) {
            let updateAsset = await Assets.findOneAndUpdate(
              {
                userId: referer_userdetails._id,
                currency: currency._id,
              },
              {
                $inc: {
                  spotwallet: token_amount,
                },
              },
              { new: true }
            );

            const newrefcommission = new ReferralCommission({
              percentage: percentage,
              userId: referer_userdetails._id,
              referraluserId: userId,
              currencyId: currency._id,
              amount: token_amount,
              currencySymbol: currency.currencySymbol,
            });

            let saveData = await newrefcommission.save();
          }
        }
      }
    }
  } catch (err) {
    console.log(err, "Commission err");
  }
};

//Referralcommission("BTC", 1, "62667ff12b5d0c507556ada5"); //for testing purpose

export const cron_coinmarketcap = async () => {
  try {
    let currencies = await Currency.find({
      status: "active",
    });

    for (let i = 0; i < currencies.length; i++) {
      // console.log("coin market cap 12e1");

      let symbol = currencies[i].currencySymbol;
      let respData = await axios({
        method: "get",
        url: config.COINMARKETCAP.PRICE_CONVERSION,
        headers: {
          "X-CMC_PRO_API_KEY": config.COINMARKETCAP.API_KEY,
        },
        params: {
          amount: 1,
          symbol: symbol,
          convert: "USDT",
        },
      });
      // console.log(respData, "respDatarespData");

      if (respData && respData.data) {
        const { data } = respData.data;
        var convert_usdtprice = data.quote.USDT.price;

        let currencies = await Currency.findOneAndUpdate(
          {
            currencySymbol: symbol,
          },
          { $set: { usdtamount: convert_usdtprice } }
        );

        //   console.log(data, "convert_usdtprice");
      }
    }

    let respDatas = await axios({
      method: "get",
      url: config.COINMARKETCAP.PRICE_CONVERSION,
      headers: {
        "X-CMC_PRO_API_KEY": config.COINMARKETCAP.API_KEY,
      },
      params: {
        amount: 1,
        symbol: "INR",
        convert: "USD",
      },
    });
    const { data } = respDatas.data;
    var convert_usdtprice = data.quote.USD.price;

    // console.log("respDatas", respDatas.data, convert_usdtprice);

    var Priceconversiondata = await PriceConversion.find({
      baseSymbol: "INR",
      convertSymbol: "USD",
    });
    // console.log("PriceconversiondataPriceconversiondataPriceconversiondata",Priceconversiondata)
    if (Priceconversiondata) {
      for (let item of Priceconversiondata) {
        await PriceConversion.updateOne(
          {
            baseSymbol: "INR",
            convertSymbol: "USD",
          },
          {
            $set: {
              convertPrice: convert_usdtprice,
            },
          }
        );
      }
    }

    // return res.status(200).json({ success: true, messages: "success" });
  } catch (err) {
    console.log(err);
    // return res
    //   .status(500)
    //   .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const refferDetail = async (req, res, next) => {
  console.log("refe krishna", req.user.id);
  try {
    let RefferCount = await User.find({ referaluserid: req.user.id });
    // console.log("RefferCountRefferCountRefferCount", RefferCount);

    return res
      .status(200)
      .json({ success: true, messages: "success", result: RefferCount.length });
  } catch (err) {
    console.log(err, "Commission err");
  }
};

export const refferDetaillist = async (req, res, next) => {
  console.log("req.user.id----------------->>>", req.user.id);
  try {
    // let RefferData = await User.find({ referaluserid: req.user.id }).select({
    //   email: 1,
    //   firstName: 1,
    //   createdAt: 1,
    //   country: 1,
    //   city: 1,
    //   firstName: 1,
    //   lastName: 1,
    //   userid: 1,
    // });
    // console.log("RefferData", RefferData);

    // let RefferData1 = await ReferralCommission.find({ userId: req.user.id })
    // .select({percentage:1,amount:1,currencySymbol:1,referraluserId:1})
    // .populate('referraluserId','firstName lastName email createdAt city country');
    // console.log(RefferData1,"-------------------->RefferData1")

    let RefferData = await User.aggregate([
      {
        $match: {
          $and: [
           
            { $or: [{ emailStatus: "verified"}, {phoneStatus: "verified" }] },
            { referaluserid: ObjectId(req.user.id) },
          ],
        },
      },
      {
        $project: {
          _id: "$_id",
          referaluserid: "$referaluserid",
          createdAt: "$createdAt",
          email: "$email",
          firstName: "$firstName",
          lastName: "$lastName",
          city: "$city",
          country: "$country",
        },
      },
      {
        $lookup: {
          from: "referralcommission",
          localField: "_id",
          foreignField: "referraluserId",
          as: "result",
        },
      },
      // { $unwind: "$result" },
      // {
      //   $lookup: {
      //     from: "referralcommission",
      //     localField: "result.userId",
      //     foreignField: "referraluserId",
      //     as: "alldata",
      //   },
      // },
      // { $unwind: "$alldata" },
      // {
      //   $project: {
      //     group_name: "$result.group_name",
      //     group_image: "$result.group_image",
      //     symbols: "$result.symbols",
      //     topics: "$result.topics",
      //     username: "$alldata.username",
      //     verify: "$alldata.verify",
      //   },
      // },
    ]);
    // .exec(function (err, results) {
    //   console.log(results, results.length, "------------->results123");
    // });

    return res
      .status(200)
      .json({ success: true, messages: "success", result: RefferData });
  } catch (err) {
    console.log(err, "Commission err");
  }
};
