// import package
import mongoose from "mongoose";

// import config
import config from "../config";
import contactus from '../models/contactus';

// import model
import { SpotPair, SiteSetting, PriceConversion } from "../models";

// import lib
import * as recaptchaFun from "../lib/recaptcha";

const ObjectId = mongoose.Types.ObjectId;

/** 
 * Get Site Setting
 * URL: /adminapi/getSiteSetting
 * METHOD : GET
*/
export const getPairDropdown = async (req, res) => {
  try {
      let spotPair = await SpotPair.find({ "status": "active" }, {
          "firstCurrencySymbol": 1,
          "secondCurrencySymbol": 1,
          "markPrice": 1
      })
      if (spotPair && spotPair.length > 0) {
          return res.status(200).json({ 'success': true, 'message': "Fetch success", 'result': spotPair })
      }
      return res.status(400).json({ 'success': false, 'message': "No record" })
  } catch (err) {
      return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
  }
}

/**
 * Get Market Trend
 * URL: /api/getMarketTrend
 * METHOD : GET
 */
export const getMarketTrend = async (req, res) => {
  try {
    let siteSettingData = await SiteSetting.findOne({}, { marketTrend: 1 });
    if (!siteSettingData) {
      return res
        .status(400)
        .json({ success: false, message: "There is no setting" });
    }

    let spotPairData = await SpotPair.aggregate([
      { $match: { _id: { $in: siteSettingData.marketTrend } } },
      {
        $lookup: {
          from: "currency",
          localField: "firstCurrencyId",
          foreignField: "_id",
          as: "firstCurrencyInfo",
        },
      },
      { $unwind: "$firstCurrencyInfo" },
      {
        $project: {
          firstCurrencySymbol: 1,
          secondCurrencySymbol: 1,
          firstCurrencyName: "$firstCurrencyInfo.currencyName",
          firstCurrencyImage: {
            $concat: [
              config.SERVER_URL,
              config.IMAGE.CURRENCY_URL_PATH,
              "$firstCurrencyInfo.currencyImage",
            ],
          },
          markPrice: 1,
          change: 1,
        },
      },
    ]);

    if (spotPairData && spotPairData.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Fetch success",
        result: spotPairData,
      });
    }
    return res.status(400).json({ success: false, message: "No record" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

/**
 * Get Pair Data
 * URL: /api/pairData
 * METHOD : GET
 * QUERY : firstCurrencySymbol, secondCurrencySymbol
 */
export const getPairData = async (req, res) => {
  const reqQuery = req.query;
  SpotPair.findOne(
    {
      firstCurrencySymbol: reqQuery.firstCurrencySymbol,
      secondCurrencySymbol: reqQuery.secondCurrencySymbol,
    },
    {
      markPrice: 1,
    },
    (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Something went wrong" });
      }

      return res
        .status(200)
        .json({ success: true, message: "Fetch success", result: data });
    }
  );
};

/**
 * Get Price Conversion
 * URL : /api/priceConversion
 * METHOD : GET
 */
export const getPriceCNV = (req, res) => {
  PriceConversion.find(
    {},
    { _id: 0, baseSymbol: 1, convertSymbol: 1, convertPrice: 1 },
    (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Something went wrong" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Fetch success", result: data });
    }
  );
};

export const tinyimgupload = async (req, res) => {
  try {
    let reqBody = req.body;
    let reqFile = req.files;

    return res.status(200).json({
      success: true,
      message: "Image upload done",
      result: reqFile.file[0].filename,
    });
  } catch (err) {
    console.log(err, "ERERRERe");
  }
};


export const addContactus = async (req,res) => {
  try{
      let reqBody = req.body;

      let recaptcha = await recaptchaFun.checkToken(reqBody.reCaptcha);
      if (recaptcha && recaptcha.status == false) {
        return res
          .status(500)
          .json({ success: false, message: "Invalid reCaptcha" });
      }

      const newContact = new contactus({
          email: reqBody.email,
          name: `${reqBody.firstname} ${reqBody.lastname}`,
          firstname: reqBody.firstname,
          lastname: reqBody.lastname,
          message: reqBody.message,
      });

     await newContact.save();            
     
     return res.status(200).json({ "status": true, "message": "Your Message submitted successfully" });

  }catch(err){
      console.log(err,"--------")
      res.status(500).json({ "status": false, 'message': "error on server" })
  }
}