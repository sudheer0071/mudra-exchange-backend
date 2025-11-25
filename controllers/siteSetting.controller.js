// import package
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path'
// import model
import {
  SiteSetting
} from '../models';

//import lib
import imageFilter from '../lib/imageFilter';
import isEmpty from '../lib/isEmpty'

// import config
import config from '../config';

/** 
 * Multer Image Uploade 
*/
const settingStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.IMAGE.SETTINGS_PATH);
  },

  // By default, multer removes file extensions so let's add them back
  filename: function (req, file, cb) {
    cb(null, 'siteSettings-' + Date.now() + path.extname(file.originalname));
  }
});

let settingsUpload = multer({
  storage: settingStorage,
  fileFilter: imageFilter,
  // limits: { fileSize: config.IMAGE.CURRENCY_SIZE }
}).fields([
  { name: 'emailLogo', maxCount: 1 },
])



export const uploadSiteDetails = (req, res, next) => {

  settingsUpload(req, res, function (err) {
    if (!isEmpty(req.validationError)) {
      return res.status(400).json({ "success": false, 'errors': { [req.validationError.fieldname]: req.validationError.messages } })
    }
    else if (err instanceof multer.MulterError) {
      return res.status(400).json({ "success": false, 'errors': { [err.field]: "TOO_LARGE" } })
    }
    else if (err) {
      return res.status(500).json({ "success": false, 'message': "SOMETHING_WRONG" })
    }
    return next();
  })
}
/** 
 * Get Site Setting
 * URL: /adminapi/getSiteSetting
 * METHOD : GET
*/
export const getSiteSetting = async (req, res) => {
  SiteSetting.findOne({}, {
    "_id": 0,
    "marketTrend": 1,
    "userDashboard": 1,
    "telegramlink": 1,
    "redditlink": 1,
    "youtubelink": 1,
    "facebookLink": 1,
    "twitterUrl": 1,
    "linkedinLink": 1,
    "siteName": 1,
    "address": 1,
    "contactNo": 1,
    "supportMail": 1,
    "emailLogo": 1

  }, (err, data) => {
    if (err) {
      return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
    }
    return res.status(200).json({ 'success': true, 'message': "Fetch success", 'result': data })
  })
}

/** 
 * Get Site Setting
 * URL: /adminapi/updateSiteSetting
 * METHOD : PUT
 * BODY : marketTrend
*/
export const updateSiteSetting = async (req, res) => {
  try {
    let siteSettingData = await SiteSetting.findOne();
    if (!siteSettingData) {
      return res.status(400).json({ 'success': false, 'message': "No record" })
    }
    let reqBody = req.body;
    siteSettingData.marketTrend = reqBody.marketTrend ? reqBody.marketTrend : siteSettingData.marketTrend;

    let updateData = await siteSettingData.save();

    let result = {
      'marketTrend': updateData.marketTrend
    }
    return res.status(200).json({ 'success': true, 'message': "Fetch success", 'result': result })
  } catch (err) {
    return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
  }
}



export const updateSiteDetails = async (req, res) => {
  try {
    console.log(reqBody,'reqBodyreqBody')
    const reqBody = req.body
    const reqFile = req.files
    let siteSettingData = await SiteSetting.findOne({});
    
    siteSettingData.facebookLink = reqBody.fbLink;
    siteSettingData.telegramlink = reqBody.telegramlink;
    siteSettingData.redditlink = reqBody.redditlink;
    siteSettingData.youtubelink = reqBody.youtubelink;
    siteSettingData.twitterUrl = reqBody.twiterLink;
    siteSettingData.linkedinLink = reqBody.linkedInLink;
    siteSettingData.siteName = reqBody.siteName;
    siteSettingData.address = reqBody.address;
    siteSettingData.contactNo = reqBody.contactNo;
    siteSettingData.supportMail = reqBody.supportMail;
    siteSettingData.emailLogo = isEmpty(reqFile) ? siteSettingData.emailLogo : reqFile.emailLogo[0].filename;

    await siteSettingData.save();

    return res.status(200).json({ 'success': true, 'message': "updated success", })

  } catch (err) {

    return res.status(500).json({ 'success': false, 'message': "Something went wrong" })

  }
}

/**
 * Display the currency in user dashboard
 * URL : /adminapi/updateUsrDash
 * METHOD : PUT
 * BODY : currencyList (currencyId,colorCode)
*/
export const updateUsrDash = async (req, res) => {
  try {
    let siteSettingData = await SiteSetting.findOne();
    if (!siteSettingData) {
      return res.status(400).json({ 'success': false, 'message': "No record" })
    }
    let reqBody = req.body;
    siteSettingData.userDashboard = reqBody.currencyList;

    let updateData = await siteSettingData.save();

    let result = {
      'userDashboard': updateData.userDashboard
    }
    return res.status(200).json({ 'success': true, 'message': "Fetch success", 'result': result })
  } catch (err) {
    return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
  }
}