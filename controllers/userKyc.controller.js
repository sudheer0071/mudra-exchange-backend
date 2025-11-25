// import package
import multer from "multer";
import path from "path";
import mongoose from "mongoose";
import fs from "fs";
// import modal
import { User, UserKyc } from "../models";
import userkycshistory from "../models/userKycHistory"
import { newNotification } from "./notification.controller";
// import config
import config from "../config";

// import controller

import { mailTemplateLang } from "./emailTemplate.controller";
// import lib
import imageFilter from "../lib/imageFilter";
import isEmpty from "../lib/isEmpty";
import { removeKycDbFile, removeKycReqFile } from "../lib/removeFile";
import {
  paginationQuery,
  filterQuery,
  filterProofQuery,
  filterSearchQuery,
} from "../lib/adminHelpers";
const ObjectId = mongoose.Types.ObjectId;
/**
 * Multer Image Uploade
 */
const kycStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create directory if it doesn't exist
    const dir = config.IMAGE.KYC_PATH;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },

  // By default, multer removes file extensions so let's add them back
  filename: function (req, file, cb) {
    cb(null, "file-" + Date.now() + path.extname(file.originalname));
  },
});

let kycUpload = multer({
  storage: kycStorage,
  fileFilter: imageFilter,
  limits: { fileSize: config.IMAGE.ID_DOC_SIZE },
}).fields([
  { name: "frontImage", maxCount: 1 },
  { name: "backImage", maxCount: 1 },
  { name: "selfiImage", maxCount: 1 },
]);

let IDUpload = multer({
  storage: kycStorage,
  fileFilter: imageFilter,
  limits: { fileSize: config.IMAGE.DEFAULT_SIZE },
}).fields([
  { name: "frontImage", maxCount: 1 },
  { name: "backImage", maxCount: 1 },
  { name: "selfiImage", maxCount: 1 },
]);

export const uploadKyc = (req, res, next) => {
  console.log("--------reqfile address", req.file, req.files, req.body);

  kycUpload(req, res, function (err) {
    if (!isEmpty(req.validationError)) {
      console.log(err, "err1");

      return res.status(400).json({
        success: false,
        errors: {
          [req.validationError.fieldname]: req.validationError.messages,
        },
      });
    } else if (err instanceof multer.MulterError) {
      console.log(err, "err2");
      return res
        .status(400)
        .json({ success: false, errors: { [err.field]: "TOO_LARGE" } });
    } else if (err) {
      console.log(err, "err3");

      return res
        .status(500)
        .json({ success: false, message: "SOMETHING_WRONG" });
    }
    return next();
  });
};

/**
 * Upload ID Document
 */
export const IDKycUpload = (req, res, next) => {
  IDUpload(req, res, function (err) {
    console.log("--------reqfile", req.files, req.body);
    if (!isEmpty(req.validationError)) {
      return res.status(400).json({
        success: false,
        errors: {
          [req.validationError.fieldname]: req.validationError.messages,
        },
      });
    } else if (err instanceof multer.MulterError) {
      console.log(err, "err2");
      return res
        .status(400)
        .json({ success: false, errors: { [err.field]: "TOO_LARGE" } });
    } else if (err) {
      console.log("ERROORRR...////",err)
      return res
        .status(500)
        .json({ success: false, message: "SOMETHING_WRONG" });
    }
    return next();
  });
};

/**
 * Create New User KYC Modal
 */
export const createUserKyc = (userId) => {
  let newDoc = new UserKyc({
    userId,
  });

  newDoc.save((err, userKyc) => {
    if (err) {
      return console.log("Error on create Kyc", err.toString());
    }
    return console.log("Kyc Create Successfully");
  });
};

/**
 * Get Kyc Detail
 * URL: /api/kycdetail
 * METHOD : GET
 */
export const getUserKycDetail = async (req, res) => {
  UserKyc.findOne(
    { userId: req.user.id },
    { _id: 0, idProof: 1, addressProof: 1 },
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

/**
 * Update Id Proof
 * URL: /api/kyc/idproof
 * METHOD : PUT
 * BODY : type,proofNumber, frontImage, backImage, selfiImage
 */
export const updateIdProof = async (req, res) => {
  try {
    let reqBody = req.body,
      reqFile = req.files;

    console.log(reqBody, "body kyc");
    console.log(reqFile, "files");

    newNotification({
      userId: req.user.id,
      type: "Id Proof KYC Submitted",
      description: "Your Id Proof KYC Submitted Successfully",
    
    });
    let idProofDoc = await UserKyc.findOne(
      { userId: req.user.id },
      { idProof: 1 }
    );
    if (!idProofDoc) {
      return res.status(409).json({ success: false, message: "NO_DATA" });
    }

    if (
      idProofDoc.idProof.status == "new" ||
      idProofDoc.idProof.status == "rejected"
    ) {
      // removeKycDbFile(idProofDoc.idProof)

      idProofDoc.idProof.type = reqBody.type;
      idProofDoc.idProof.proofNumber = reqBody.proofNumber;
      idProofDoc.idProof.frontImage = reqFile.frontImage[0].filename;
      idProofDoc.idProof.backImage =
        reqBody.type == "passport" ? "" : reqFile.backImage[0].filename;
      idProofDoc.idProof.selfiImage = reqFile.selfiImage[0].filename;
      // idProofDoc.idProof.frontImage = await cloudinaryCtrl.uploadImage(reqFile.frontImage[0].path);
      // idProofDoc.idProof.backImage = reqBody.type == 'passport' ? '' : await cloudinaryCtrl.uploadImage(reqFile.backImage[0].path);
      // idProofDoc.idProof.selfiImage = await cloudinaryCtrl.uploadImage(reqFile.selfiImage[0].path);
      idProofDoc.idProof.status = "pending";
    } else {
      // removeKycReqFile(req.files, "id");
    }

    let userKycData = await idProofDoc.save();

    return res.status(200).json({
      success: true,
      message: "IDENTITY_DOC_UPLOAD_SUCCESS",
      result: userKycData,
    });
  } catch (err) {
    // removeKycReqFile(req.files, "id");
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

/**
 * Update Address Proof
 * URL: /api/kyc/addressproof
 * METHOD : PUT
 * BODY : type, frontImage
 */
export const updateAddressProof = async (req, res) => {
  try {
    let reqBody = req.body,
      reqFile = req.files;

    console.log(reqBody, "body kyc add");
    console.log(reqFile, "files add");
    newNotification({
      userId: req.user.id,
      type: "Address  Proof KYC Submitted",
      description: "Your Permanent Account Number KYC document Submitted Successfully",
      
    });
    let kycdoc = await UserKyc.findOne(
      { userId: req.user.id },
      { addressProof: 1 }
    );
    if (!kycdoc) {
      return res.status(409).json({ success: false, message: "NO_DATA" });
    }

    if (
      kycdoc.addressProof.status == "new" ||
      kycdoc.addressProof.status == "rejected"
    ) {
      // removeKycDbFile(kycdoc.addressProof);
      kycdoc.addressProof.type = reqBody.type;
      kycdoc.addressProof.frontImage = reqFile.frontImage[0].filename;
      // kycdoc.addressProof.frontImage = await cloudinaryCtrl.uploadImage(reqFile.frontImage[0].path);
      kycdoc.addressProof.status = "pending";
    } else {
      // removeKycReqFile(req.files, "id");
    }

    let userKycData = await kycdoc.save();

    return res.status(200).json({
      success: true,
      message: "ADDRESS_DOC_UPLOAD_SUCCESS",
      result: userKycData,
    });
  } catch (err) {
    // removeKycReqFile(req.files, "id");
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

/**
 * Get All User Kyc Detail
 * URL: /api/kyc/addressproof
 * METHOD : PUT
 * BODY : type, frontImage
 */
export const getAllUserKyc = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let filter = filterSearchQuery(req.query, [
      "email",
      "idProof.status",
      "addressProof.status",
    ]);

    let count = await UserKyc.aggregate([
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
          type: "$userInfo.type",
          userid: "$userInfo.userid",
          userId: 1,
          phoneNo:"$userInfo.phoneNo",
          idProof: {
            type: 1,
            proofNumber: 1,
            status: 1,
            reason:1,
          },
          addressProof: {
            type: 1,
            status: 1,
            reason:1,
          },
        },
      },
      { $match: filter },
    ]);

    let data = await UserKyc.aggregate([
      { $sort: { updatedAt: -1 } },

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
          type: "$userInfo.type",
          userid: "$userInfo.userid",
          userId: 1,
          phoneNo:"$userInfo.phoneNo",
          idProof: {
            type: 1,
            proofNumber: 1,
            reason:1,
            // "frontImage": 1,
            frontImage: {
              $concat: [
                config.SERVER_URL,
                config.IMAGE.KYC_URL_PATH,
                "$idProof.frontImage",
              ],
            },
            // "backImage": 1,
            backImage: {
              $concat: [
                config.SERVER_URL,
                config.IMAGE.KYC_URL_PATH,
                "$idProof.backImage",
              ],
            },
            // "selfiImage": 1,
            selfiImage: {
              $concat: [
                config.SERVER_URL,
                config.IMAGE.KYC_URL_PATH,
                "$idProof.selfiImage",
              ],
            },
            status: 1,
          },
          addressProof: {
            type: 1,
            reason:1,
            // "frontImage": 1,
            frontImage: {
              $concat: [
                config.SERVER_URL,
                config.IMAGE.KYC_URL_PATH,
                "$addressProof.frontImage",
              ],
            },
            status: 1,
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
    return res.status(500).json({ success: false });
  }
};

/**
 * Approve User Kyc Doc's
 * URL: /api/kyc/addressproof
 * METHOD : POST
 * BODY : userId, formType(idProof,addressProof)
 */
export const approveUserKyc = async (req, res) => {
  try {
    let reqBody = req.body;
    if (!["idProof", "addressProof"].includes(reqBody.formType)) {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }

    let kycData = await UserKyc.findOne({ userId: reqBody.userId });
    if (!kycData) {
      return res.status(400).json({ success: false, message: "No Data" });
    }

    if (kycData.status == "new") {
      return res
        .status(400)
        .json({ success: false, message: "Upload kyc document" });
    }

    if (kycData.status == "approved") {
      return res
        .status(400)
        .json({ success: false, message: "KYC doc's already approved" });
    }

    if (kycData.status == "rejected") {
      return res.status(400).json({
        success: false,
        message: "KYC doc's was rejected. Please upload new document",
      });
    }

    if (reqBody.formType == "idProof") {
      kycData.idProof.status = "approved";
      let type=reqBody.formType;
      let updatekychis={
        type: kycData.idProof.type,
        proofNumber:kycData.idProof.proofNumber,
        frontImage:kycData.idProof.frontImage,
        backImage: kycData.idProof.backImage,
        selfiImage:kycData.idProof.selfiImage,
        reason: "approved",
        status:'approved'
      }
      // console.log("updateeeeeeeeeee",updatekychis)
      let updatekychistory = new userkycshistory({
        userId: reqBody.userId,
        type:type,
        idProof:updatekychis, 
        
      });
      // console.log("updateeeeeeeeeee",updatekychistory)
   let updatekychistory1= await updatekychistory.save();
   newNotification({
    adminId: req.user.id,
    userId: kycData.userId,
    type: "Id Proof KYC Rejected",
    viewType:"admin",
    description: "User Id Proof KYC Approved Successfully",
   
  });

    } else if (reqBody.formType == "addressProof") {
      kycData.addressProof.status = "approved";
      let type=reqBody.formType
      let updatekychis={
        type: kycData.addressProof.type,
        frontImage:kycData.addressProof.frontImage,

        reason:  reqBody.reason,
        status:'approved'
      }
    
      let updatekychistory = new userkycshistory({
        userId: reqBody.userId,
        type:type,
        addressProof:updatekychis, 
        
      });
    
   let updatekychistory1= await updatekychistory.save();
   newNotification({
    adminId: req.user.id,
    userId: kycData.userId,
    type: "Permanent Account Number KYC Document Approved",
    viewType:"admin",
    description: "User Permanent Account Number KYC Document Approved Successfully",
  
  });
    }

    await kycData.save();
    return res
      .status(200)
      .json({ success: true, message: "KYC document approved successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went worng" });
  }
};

/**
 * Reject User Kyc Doc's
 * URL: /api/kyc/addressproof
 * METHOD : PUT
 * BODY : userId, formType(idProof,addressProof), reason
 */
export const rejectUserKyc = async (req, res) => {
  try {
    let reqBody = req.body;
    console.log("reqBodyreqBodyreqBodyreqBody",reqBody)
    if (!["idProof", "addressProof"].includes(reqBody.formType)) {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }

    let kycData = await UserKyc.findOne({ userId: reqBody.userId });
    // console.log("qaaaaaaaaaaaaaaaaaaaaaaaaa",kycData)
    if (!kycData) {
      return res.status(400).json({ success: false, message: "No Data" });
    }

    if (kycData.status == "new") {
      return res
        .status(400)
        .json({ success: false, message: "Upload kyc document" });
    }

    if (kycData.status == "approved") {
      return res
        .status(400)
        .json({ success: false, message: "KYC doc's already approved" });
    }

    // if (kycData.status == "rejected") {
    //   return res.status(400).json({
    //     success: false,
    //     message: "KYC doc's was rejected. Please upload new document",
    //   });
    // }

    if (reqBody.formType == "idProof") {
   
      kycData.idProof.status = "rejected";
      kycData.idProof.reason = reqBody.reason;
      let type=reqBody.formType
      let updatekychis={
        type: kycData.idProof.type,
        proofNumber:kycData.idProof.proofNumber,
        frontImage:kycData.idProof.frontImage,
        backImage: kycData.idProof.backImage,
        selfiImage:kycData.idProof.selfiImage,
        reason:  reqBody.reason,
        status:'rejected'
      }
      // console.log("updateeeeeeeeeee",updatekychis)
      let updatekychistory = new userkycshistory({
        userId: reqBody.userId,
        type:type,
        idProof:updatekychis, 
        
      });
      console.log("updateeeeeeeeeee",updatekychistory)
   let updatekychistory1= await updatekychistory.save();
   newNotification({
    adminId: req.user.id,
    userId: kycData.userId,

    type: "Id Proof KYC Rejected",
    viewType:"admin",
    description: "User Id Proof KYC Rejected Successfully",
  
  });

    } else if (reqBody.formType == "addressProof") {
     
      kycData.addressProof.status = "rejected";
      kycData.addressProof.reason = reqBody.reason;
      let type=reqBody.formType
      let updatekychis={
        type: kycData.addressProof.type,
        frontImage:kycData.addressProof.frontImage,

        reason:  reqBody.reason,
        status:'rejected'
      }
      // console.log("updateeeeeeeeeee",updatekychis)
      let updatekychistory = new userkycshistory({
        userId: reqBody.userId,
        type:type,
        addressProof:updatekychis, 
        
      });
      // console.log("updateeeeeeeeeee",updatekychistory)
   let updatekychistory1= await updatekychistory.save();
   newNotification({
    adminId: req.user.id,
    userId: kycData.userId,
    type: "Permanent Account Number KYC Document Rejected",
    viewType:"admin",
    description: "Permanent Account Number KYC Document Rejected",
    
  });

    }


    var userDetails = await User.findOne({ _id: reqBody.userId });
    let content = {
      message: "Your Kyc Rejected!!!",
      reason: reqBody.reason,
    };
    await kycData.save();
    mailTemplateLang({
      userId: reqBody.userId,
      identifier: "alert_notification_kyc",
      toEmail: userDetails.email,
      content,
    });
    return res
      .status(200)
      .json({ success: true, message: "KYC document rejected successfully" });
  } catch (err) {
    console.log("kkkkkyyyyyccccerrrrrrrrrrrrr",err)
    return res
      .status(500)
      .json({ success: false, message: "Something went worng" });
  }
};

/**
 * Change User Type
 * URL: /api/changeUsrType
 * METHOD : PUT
 * PARAMS : userId
 */
export const changeUserType = async (req, res) => {
  try {
    let userData = await User.findOne(
      { userid: req.params.userId },
      { type: 1 }
    );
    if (!userData) {
      return res.status(400).json({ success: false, message: "No Data" });
    }

    if (userData.type == "basic_processing") {
      userData.type = "basic";
    } else if (userData.type == "advanced_processing") {
      userData.type = "advanced";
    } else if (userData.type == "pro_processing") {
      userData.type = "pro";
    }

    await userData.save();
    return res.status(200).json({
      success: true,
      message: "Verification type updated successfully",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went worng" });
  }
};



export const getUserKychistory = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let filter = filterSearchQuery(req.query, [
      "idProof.status",
      "addressProof.status",
    ]);
    let user={
      userId:ObjectId(req.query.id)
    }
    console.log("aaaaaaaaaaaaaaaaaa",user)
    let count = await userkycshistory.aggregate([
      { $match: user },
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
          type: "$userInfo.type",
          userid: "$userInfo.userid",
          userId: 1,
          createdAt:1,
          idProof: {
            reason:1,
            type: 1,
            proofNumber: 1,
            status: 1,
          },
          addressProof: {
            reason:1,
            type: 1,
            status: 1,
          },
        },
      },
      { $match: filter },
    ]);

    let data = await userkycshistory.aggregate([
      { $sort: { updatedAt: -1 } },
      { $match: user },
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
          type: "$userInfo.type",
          userid: "$userInfo.userid",
          userId: 1,
          createdAt:1,
          idProof: {
            type: 1,
            proofNumber: 1,
            reason:1,
            // "frontImage": 1,
            frontImage: {
              $concat: [
                config.SERVER_URL,
                config.IMAGE.KYC_URL_PATH,
                "$idProof.frontImage",
              ],
            },
            // "backImage": 1,
            backImage: {
              $concat: [
                config.SERVER_URL,
                config.IMAGE.KYC_URL_PATH,
                "$idProof.backImage",
              ],
            },
            // "selfiImage": 1,
            selfiImage: {
              $concat: [
                config.SERVER_URL,
                config.IMAGE.KYC_URL_PATH,
                "$idProof.selfiImage",
              ],
            },
            status: 1,
          },
          addressProof: {
            reason:1,
            type: 1,
            // "frontImage": 1,
            frontImage: {
              $concat: [
                config.SERVER_URL,
                config.IMAGE.KYC_URL_PATH,
                "$addressProof.frontImage",
              ],
            },
            status: 1,
          },
        },
      },
      { $match: filter },
      // { $skip: pagination.skip },
      // { $limit: pagination.limit },
    ]);
let userdetail= await User.findById(ObjectId(req.query.id))
  var result = {
    data,
    count: data.length,
    userdetail:userdetail,
  };

   

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.log('kyechistroyerr',err)
    return res.status(500).json({ success: false });
  }
};

