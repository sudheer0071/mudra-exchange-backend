// import package
import mongoose from "mongoose";
import node2fa from "node-2fa";
import couponCode from "coupon-code";
import moment from "moment";
import jwt_decode from "jwt-decode";
import axios from "axios";
import Contact from "../models/contactus";
import async from "async";
// import modal
import {
  User,
  UserToken,
  UserSetting,
  UserKyc,
  Currency,
  Language,
  Assets,
  SiteSetting,
  Usertemp,
  ReferTable,
  Referinfo,
  Admin,
  PassBook,
  DeletedAccount,Transaction
} from "../models";

// import controller
import { mailTemplateLang } from "./emailTemplate.controller";
import { newNotification } from "./notification.controller";
import { createUserKyc } from "./userKyc.controller";
import { createUserAsset, CreateDummyAsset } from "./assets.controller";
import { createPassBook } from "./passbook.controller";
// import config
import config from "../config";

import bcrypt from "bcrypt";

// import lib
import { encryptString, decryptString } from "../lib/cryptoJS";

import { generatePassword, comparePassword } from "../lib/bcrypt";
import { sentSms } from "../lib/smsGateway";
import * as recaptchaFun from "../lib/recaptcha";
import isEmpty from "../lib/isEmpty";
import { IncCntObjId } from "../lib/generalFun";
import { paginationQuery, filterSearchQuery, searchQuery } from "../lib/adminHelpers";

import { socketEmitOne, socketEmitAll } from "../config/socketIO";

// import * as numverify from '../lib/numverify'
var CryptoJS = require("crypto-js");

const ObjectId = mongoose.Types.ObjectId;

export const MergeUser = async (req, res) => {
  try {
    var icouserdata = await Usertemp.find();

    // console.log("icosusdsdsd",icouserdata)
    for (var i = 0; i < icouserdata.length; i++) {
      let checkUser = await User.findOne({ email: icouserdata[i].email });

      if (!checkUser) {
        const referralcode = couponCode.generate();
        const userid = Math.floor(100000 + Math.random() * 900000);

        let newUser = new User({
          _id: icouserdata[i]._id,
          email: icouserdata[i].email,
          // 'password': icouserdata[i].password,
          pwd: icouserdata[i].password,
          userid: userid,
          referencecode: referralcode,
          status: "verified",
        });

        newUser.uniqueId = IncCntObjId(newUser._id);

        let newDoc = await newUser.save();

        createUserKyc(newDoc._id);
        CreateDummyAsset(newDoc);
        defaultUserSetting(newDoc);
      }
    }
    return res.status(200).json({ success: true, message: "Api Works" });
  } catch (err) {
    console.log("errerer", err);
  }
};

export const PriceUpdate = async (req, res) => {
  var pricedata = req.body;

  socketEmitAll("inrconversion", {
    data: pricedata,
  });
  return res.status(200).json({ success: true, message: "Success" });

};

export const check2FA = async (req, res) => {
  try {
    let userId = req.user.id;
    let checkUser = await User.findOne({ _id: userId });
    if (checkUser.google2Fa && !isEmpty(checkUser.google2Fa.secret)) {
      return res
        .status(200)
        .json({ success: true, status: "TWO_FA", message: "Enabled" });
    } else {
      return res.status(400).json({
        success: false,
        status: "TWO_FA_ACTIVATE",
        message: "Not Enabled",
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

export const LogoutFromAll = async (req, res) => {
  try {
    // console.log("logout from ALl    ",req.user.id)

    let payloadData = {
      _id: req.user.id,
    };
    let token = new User().generateJWT(payloadData);
    var jsonencryt = {
      token: token,
    };
    let respData = await axios({
      method: "post",
      url: `${config.ICOAPI}/users/logoutfromall`,
      data: jsonencryt,
    });
    return res.status(200).json({ success: true, message: "Logout done" });
  } catch (err) {
    // console.log("erresss",err)
  }
};

/**
 * Create New User
 * URL: /api/icoregisterform
 * METHOD : POST
 * BODY : encrypted token detailsss
 */

export const CreateICOuser = async (req, res) => {
  try {
    var bytes = CryptoJS.AES.decrypt(req.body.token, config.secretOrKey);
    req.body = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    var reqBody = req.body;
    // console.log("sadasdasdas",req.body)

    let checkUser = await User.findOne({ email: reqBody.email });

    if (checkUser) {
      return res
        .status(400)
        .json({ success: false, errors: { email: "Email already exists" } });
    }

    const referralcode = req.body.randomaddress;
    // const userid = Math.floor(100000 + Math.random() * 900000);
    const userid = IncCntObjId(reqBody._id);
    let newUser = new User({
      _id: reqBody._id,
      email: reqBody.email,
      password: reqBody.password,
      userid: userid,
      referencecode: referralcode,
      status: "verified",
    });
    newUser.uniqueId = IncCntObjId(newUser._id);
    let newDoc = await newUser.save();

    createUserKyc(newDoc._id);
    createUserAsset(newDoc);
    defaultUserSetting(newDoc);

    return res.status(200).json({
      success: true,
      message: "Your account has been successfully Added",
    });
  } catch (err) {
    console.log("errerrerr", err);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

/**
 * Create New User
 * URL: /api/register
 * METHOD : POST
 * BODY : email, password, confirmPassword, referalcode, langCode
 */
export const createNewUser = async (req, res) => {
  try {

    let reqBody = req.body;

    if (reqBody.referalcode) {
      let existip = await Referinfo.find({
        ipaddress: reqBody.ipaddress,
        referencecode: reqBody.referalcode,
      });
      console.log(existip, "------------->>>existip");
      if (!isEmpty(existip)) {
        let findadmin = await Admin.find({ role: "superadmin" });
        newNotification({
          adminId: findadmin[0]._id,
          viewType: "admin",
          type: "Register Blocked due to same referral code used in multiple times from same IP",
          description:
            `Register Blocked due to same referral code used in multiple times from same IP,IP:` +
            reqBody.ipaddress +
            `Email Id:` +
            reqBody.email +
            ",Refferal code :" +
            reqBody.referalcode,
        });
        return res
          .status(500)
          .json({ success: false, message: "This referral already exists." });
      }
    }

    let refer_parent;
    let recaptcha = await recaptchaFun.checkToken(reqBody.reCaptcha);
    if (recaptcha && recaptcha.status == false) {
      return res
        .status(500)
        .json({ success: false, message: "Invalid reCaptcha" });
    }
    if (reqBody.roleType == 1) {
      reqBody.email = reqBody.email.toLowerCase();

      let checkUser = await User.findOne({ email: reqBody.email }).lean();
      if (checkUser) {
        if (checkUser.status == "deleted") {
          return res.status(400).json({
            success: false,
            message: "The email/phone-number is disabled for registration.",
          });
        } else {
          return res
            .status(400)
            .json({ success: false, errors: { email: "Email already exists" } });
        }
      }

      const referralcode = couponCode.generate();
      const userid = Math.floor(100000 + Math.random() * 900000);

      let newUser = new User({
        email: reqBody.email,
        password: reqBody.password,
        userid: userid,
        referencecode: referralcode,
      });

      newUser.uniqueId = IncCntObjId(newUser._id);

      if (!isEmpty(reqBody.referalcode)) {
        let checkReferralUser = await User.findOne({
          referencecode: reqBody.referalcode,
        }).lean();
        if (!checkReferralUser) {
          return res.status(500).json({
            success: false,
            errors: { referalcode: "Invalid referal code" },
          });
        }

        // await ReferTable.update(
        //   { userId: checkReferralUser._id },
        //   { $push: { refer_child: curuser._id } }
        // );
        var referer_referencecode = checkReferralUser.referencecode;

        newUser.referaluserid = checkReferralUser._id;
        refer_parent = checkReferralUser._id;
      }

      let newDoc = await newUser.save();

      let refData = new Referinfo({
        refer_parent: refer_parent,
        refer_child: newUser._id,
        ipaddress: reqBody.ipaddress,
        referencecode: reqBody.referalcode,
      });
      let saveRefData = await refData.save();
      // console.log(saveRefData,"---------------->>>>saveRefData")

      let newUserdd = {
        _id: newDoc._id,
        email: newDoc.email,
        password: reqBody.password,
        status: "verified",
        referencecode: referralcode,
        referer_referencecode: referer_referencecode,
        role: 1,
      };

      RegisterforExchange(newUserdd);

      // if (!isEmpty(newDoc.referaluserid)) {
      //     await ReferTable.update(
      //         { 'userId': newDoc.referaluserid },
      //         { '$push': { 'refer_child': newDoc._id } }
      //     )
      // }
      let today = new Date().toISOString().slice(0, 10);
      let encryptToken = encryptString(newDoc._id, true);
      let content = {
        email: newDoc.email,
        confirmMailUrl: `${config.FRONT_URL}/email-verification/${encryptToken}`,
        date: today,
      };
      createUserKyc(newDoc._id);
      createUserAsset(newDoc);
      defaultUserSetting(newDoc);
      mailTemplateLang({
        userId: newDoc._id,
        identifier: "activate_register_user",
        toEmail: reqBody.email,
        content,
      });
      let findadmin = await Admin.find({ role: "superadmin" });
      newNotification({
        adminId: findadmin[0]._id,
        viewType: "admin",
        type: "New Your Register -->",
        description: "New user Registered --->>" + reqBody.email,
      });
      // mailTemplate('activate_register_user', reqBody.langCode, reqBody.email, content)

      return res.status(200).json({
        success: true,
        message:
          "Your account has been successfully registered. Please check your email and verify your account. Thank you!",
      });
    } else if (reqBody.roleType == 2) {
      let checkMobile = await User.findOne({ phoneNo: reqBody.phoneNo }).lean();
      let smsOtp = Math.floor(100000 + Math.random() * 900000);
      if (checkMobile) {
        if (checkMobile.status == "deleted") {
          return res.status(400).json({
            success: false,
            message: "The email/phone-number is disabled for registration.",

          });
        } else {
          return res.status(400).json({
            success: false,
            errors: { phoneNo: "Phone Number already exists" },
          });
        }


        // if (checkMobile.phoneStatus == "verified") {
        //   return res.status(400).json({
        //     success: false,
        //     errors: { phoneNo: "Phone Number already exists" },
        //   });
      }

      if (checkMobile == null) {
        const referralcode = couponCode.generate();
        const userid = Math.floor(100000 + Math.random() * 900000);
        let newUserData = new User({
          password: reqBody.password,
          //  "role": reqBody.roleType,
          // "phoneCode": reqBody.phoneCode,
          phoneNo: reqBody.phoneNo,
          otp: smsOtp,
          otptime: new Date(),
          phoneStatus: "verified",
          status: "verified",
          userid: userid,
          referencecode: referralcode,
        });

        newUserData.uniqueId = IncCntObjId(newUserData._id);

        if (!isEmpty(reqBody.referalcode)) {
          let checkReferralUser = await User.findOne({
            referencecode: reqBody.referalcode,
          }).lean();
          if (!checkReferralUser) {
            return res.status(500).json({
              success: false,
              errors: { referalcode: "Invalid referal code" },
            });
          }

          // await ReferTable.update(
          //   { userId: checkReferralUser._id },
          //   { $push: { refer_child: curuser._id } }
          // );
          var referer_referencecode = checkReferralUser.referencecode;

          newUserData.referaluserid = checkReferralUser._id;
        }

        let userData = await newUserData.save();

        let newUserdd = {
          _id: userData._id,
          email: userData.email,
          phonenumber: userData.phoneNo,
          password: reqBody.password,
          status: "verified",
          referencecode: referralcode,
          referer_referencecode: referer_referencecode,
          role: 2,
        };

        RegisterforExchange(newUserdd);

        let encryptToken = encryptString(userData._id);

        let smsContent = {
          to: reqBody.phoneNo,
          body: "Your " + config.SITE_NAME + " OTP Code is: " + smsOtp,
        };

        // //var smsstate = sentSms(smsContent);
        var smsstate = true;
        if (smsstate) {
          createUserKyc(userData._id);
          createUserAsset(userData);
          defaultUserSetting(userData);
          let findadmin = await Admin.find({ role: "superadmin" }).lean();
          newNotification({
            adminId: findadmin[0]._id,
            viewType: "admin",
            type: "New Your Register",
            description: "New user Registered Using Email Id",
          });
          return res.status(200).json({
            success: true,
            message:
              "Your account has been successfully registered. Thank you!",
          });
        }
      }
    }
  } catch (err) {
    console.log(err, "reg err");
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

async function RegisterforExchange(user) {
  var encryptuserdata = CryptoJS.AES.encrypt(
    JSON.stringify(user),
    config.secretOrKey
  ).toString();
  // console.log("----encryptuserdata", encryptuserdata)
  var jsonencryt = {
    token: encryptuserdata,
  };
  try {
    console.log("config.ICOAPIconfig.ICOAPI", config.ICOAPI);

    let respData = await axios({
      method: "post",
      url: `${config.ICOAPI}/users/registerfromexchange`,
      data: jsonencryt,
    });

    // console.log("ressdasdasdasd",respData)
  } catch (err) {
    //   console.log("erressdasdasd", err)
  }
}

/**
 * Email Verification
 * METHOD : POST
 * URL : /api/confirm-mail
 * BODY : userId
 */
export const confirmMail = async (req, res) => {
  try {
    let reqBody = req.body;

    let userId = decryptString(reqBody.userId, true);


    let userData = await User.findById(userId);
    if (!userData) {
      return res.status(400).json({ success: false, message: "No user found" });
    }

    if (userData.emailStatus == 'verified') {
      return res.status(400).json({ success: false, message: "Your email is already verified" })
    }
    userData.status = "verified";
    userData.emailStatus = "verified";

    await userData.save();
    return res.status(200).json({
      success: true,
      message: "Your email has been verified, you can now log in",
    });
  } catch (err) {
    console.log("errerrerr.........", err);

    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

/**
 * User Login
 * METHOD : POST
 * URL : /api/login
 * BODY : email, password, loginHistory, langCode, twoFACode
 */
export const userLogin = async (req, res) => {
  try {
    let reqBody = req.body;
    console.log(reqBody, "body login");
    let lastLoginDate = "";
    let isLoginHistory = !isEmpty(req.body.loginHistory);
    if (reqBody.roleType == 1) {
      reqBody.email = reqBody.email.toLowerCase();
      var checkUser = await User.findOne({ email: reqBody.email });
      if (!checkUser) {
        return res
          .status(404)
          .json({ success: false, errors: { email: "Email not found" } });
      }

      if (checkUser.status == "unverified") {
        return res.status(400).json({
          success: false,
          message: "Your account still not activated",
        });
      }
      if (checkUser.status == "deleted") {
        return res.status(400).json({
          success: false,
          message: "The account has been deleted.",
        });
      }
    } else if (reqBody.roleType == 2) {
      var checkUser = await User.findOne({ phoneNo: reqBody.phoneNo });
      if (!checkUser) {
        return res.status(404).json({
          success: false,
          errors: { phoneNo: "Phone number not found" },
        });
      }
      if (checkUser.phoneStatus == "unverified") {
        return res.status(400).json({
          success: false,
          message: "Your Phone number is not verified",
        });
      }
      if (checkUser.status == "deleted") {
        return res.status(400).json({
          success: false,
          message: "The account has been deleted.",
        });
      }
    }
    if (checkUser.status == "Deactivated") {
      // console.log("rttttttttttttttttttttt",checkUser.active)
      return res.status(400).json({
        status: false,
        message: "Your account was blocked contact administrator",
      });
    }

    // if (!checkUser.authenticate(reqBody.password)) {
    //     loginHistory({ ...reqBody.loginHistory, ...{ "status": 'Failed', "reason": "Password incorrect", "userId": checkUser._id } })
    //     return res.status(400).json({ 'success': false, 'errors': { 'password': "Password incorrect" } });
    // }

    var passwordStatus = await bcrypt.compareSync(
      reqBody.password,
      checkUser.pwd
    );

    if (!passwordStatus) {
      loginHistory({
        ...reqBody.loginHistory,
        ...{
          status: "Failed",
          reason: "Password incorrect",
          userId: checkUser._id,
        },
      });
      return res
        .status(400)
        .json({ success: false, errors: { password: "Password incorrect" } });
    }

    if (isEmpty(reqBody.emailotp)) {
      //   console.log("otpcheckotpcheckotpcheck", otpcheck);
      //   if (reqBody.roleType == 1) {
      //     await User.updateOne(
      //       {
      //         _id: checkUser._id,
      //       },
      //       {
      //         otp: otpcheck,
      //         otptime: new Date(),
      //       }
      //     );

      //     let content = {
      //       email: checkUser.email,
      //       otp: otpcheck,
      //     };
      //     mailTemplateLang({
      //       userId: checkUser._id,
      //       identifier: "User_login_otp",
      //       toEmail: checkUser.email,
      //       content,
      //     });

      //     return res.status(200).json({
      //       success: true,
      //       status: "EMAIL_OTP_NOTIFY",
      //       message: "Enter OTP Received on Mail",
      //     });
      //   }

      if (reqBody.roleType == 2) {
        const otpcheck = Math.floor(100000 + Math.random() * 900000);
        await User.updateOne(
          {
            _id: checkUser._id,
          },
          {
            otp: otpcheck,
            otptime: new Date(),
          }
        );

        let smsContent = {
          to: reqBody.phoneNo,
          body: "Your " + config.SITE_NAME + " OTP Code is: " + otpcheck,
        };
        console.log("content----", smsContent);
        console.log("otp---", otpcheck);
        var smsstate = sentSms(smsContent);
        if (!smsstate) {
          return res.status(400).json({
            success: false,
            errors: { phoneNo: "Invalid Mobile No" },
            message: "Invalid Mobile No",
          });
        }
        return res.status(200).json({
          success: true,
          status: "EMAIL_OTP_NOTIFY",
          message: "Enter OTP Received on Phone",
        });
      }
    }

    if (isEmpty(reqBody.emailotp)) {
      if (reqBody.roleType == 1) {
        if (reqBody.email == "apptest@mudra.com") {
          var otpcheck = 123456;
        } else {
          var otpcheck = Math.floor(100000 + Math.random() * 900000);
        }

        await User.updateOne(
          {
            _id: checkUser._id,
          },
          {
            otp: otpcheck,
            otptime: new Date(),
          }
        );

        let content = {
          email: checkUser.email,
          otp: otpcheck,
        };
        if (reqBody.roleType == 1) {
          console.log("-----------662");
          mailTemplateLang({
            userId: checkUser._id,
            identifier: "User_login_otp",
            toEmail: checkUser.email,
            content,
          });
        }
        return res.status(200).json({
          success: true,
          status: "EMAIL_OTP_NOTIFY",
          message: "Enter OTP Received on Mail",
        });
      }
    }

    if (!isEmpty(reqBody.emailotp)) {
      let otpTime = new Date(new Date().getTime() - 120000); //2 min
      if (checkUser.otptime <= otpTime) {
        return res
          .status(400)
          .json({ success: false, errors: { emailotp: "OTP_EXPIRED" } });
      }

      if (checkUser.otp != reqBody.emailotp) {
        return res
          .status(400)
          .json({ success: false, errors: { emailotp: "INVALID_OTP" } });
      }
    }
    if (checkUser.google2Fa && !isEmpty(checkUser.google2Fa.secret)) {
      if (isEmpty(reqBody.twoFACode)) {
        return res.status(200).json({
          success: true,
          status: "TWO_FA",
          message: "Please Enter 2FA Code",
        });
      } else {
        let check2Fa = node2fa.verifyToken(
          checkUser.google2Fa.secret,
          reqBody.twoFACode
        );
        if (!(check2Fa && check2Fa.delta == 0)) {
          console.log("TWO_FATWO_FATWO_FA", check2Fa);
          if (check2Fa == null)
            return res.status(400).json({
              success: false,
              errors: { twoFACode: "Invalid 2FA code" },
            });
          if (check2Fa && check2Fa.delta == -1) {
            return res.status(400).json({
              success: false,
              errors: { twoFACode: "Expired 2FA Code" },
            });
          }
        }
      }
    }

    let tokenId = ObjectId()
    let payloadData = {
      _id: checkUser._id,
      uniqueId: checkUser.uniqueId,
      tokenId: tokenId,
      phoneNo: checkUser.phoneNo,
      email: checkUser.email,
    };
    checkUser.otp = "";
    checkUser.otptime = null;
    await checkUser.save();
    let token = new User().generateJWT(payloadData);

    await UserToken.findOneAndUpdate({ 'userId': checkUser._id, 'userCode': checkUser.uniqueId }, { 'tokenId': tokenId, 'token': token }, { 'upsert': true })
    // socketEmitOne('FORCE_LOGOUT', {}, checkUser._id)

    if (isLoginHistory) {
      loginHistory({
        ...reqBody.loginHistory,
        ...{ status: "Success", reason: "", userId: checkUser._id },
      });
    }

    if (checkUser.loginhistory.length > 0) {
      lastLoginDate = checkUser.loginhistory[checkUser.loginhistory.length - 1];
    }

    newNotification({
      userId: checkUser._id,
      type: "login",
      description: "last login",
    });
    let content = {
      broswername: reqBody.loginHistory && reqBody.loginHistory.broswername,
      ipaddress: reqBody.loginHistory && reqBody.loginHistory.ipaddress,
      countryName: reqBody.loginHistory && reqBody.loginHistory.countryName,
      date: new Date(),
    };
    if (reqBody.roleType == 1) {
      mailTemplateLang({
        userId: checkUser._id,
        identifier: "Login_notification",
        toEmail: checkUser.email,
        content,
      });
    }

    // mailTemplate('Login_notification', reqBody.langCode, checkUser.email, content)
    let result = userProfileDetail(checkUser);
    let userSetting = await UserSetting.findOne(
      { userId: checkUser._id },
      {
        _id: 0,
        theme: 1,
        afterLogin: 1,
      }
    ).lean();

    return res.status(200).json({
      success: true,
      status: "SUCCESS",
      message: "Login successfully",
      token,
      result,
      userSetting,
    });
  } catch (err) {
    console.log("errerss", err);
    return res.status(500).json({ success: false, message: "Error on server" });
  }
  // try {
  //   let reqBody = req.body;
  //   console.log(reqBody, "body login");
  //   let lastLoginDate = "";
  //   let isLoginHistory = !isEmpty(req.body.loginHistory);
  //   if (reqBody.roleType == 1) {
  //     reqBody.email = reqBody.email.toLowerCase();
  //     var checkUser = await User.findOne({ email: reqBody.email });
  //     if (!checkUser) {
  //       return res
  //         .status(404)
  //         .json({ success: false, errors: { email: "Email not found" } });
  //     }

  //     if (checkUser.status == "unverified") {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Your account still not activated",
  //       });
  //     }
  //   } else if (reqBody.roleType == 2) {
  //     var checkUser = await User.findOne({ phoneNo: reqBody.phoneNo });
  //     if (!checkUser) {
  //       return res.status(404).json({
  //         success: false,
  //         errors: { phoneNo: "Phone number not found" },
  //       });
  //     }
  //     if (checkUser.phoneStatus == "unverified") {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Your Phone number is not verified",
  //       });
  //     }
  //   }
  //   if (checkUser.status == "Deactivated") {
  //     // console.log("rttttttttttttttttttttt",checkUser.active)
  //     return res.status(400).json({
  //       status: false,
  //       message: "Your Account Deactivated By Admin, Please Contact Admin",
  //     });
  //   }

  //   // if (!checkUser.authenticate(reqBody.password)) {
  //   //     loginHistory({ ...reqBody.loginHistory, ...{ "status": 'Failed', "reason": "Password incorrect", "userId": checkUser._id } })
  //   //     return res.status(400).json({ 'success': false, 'errors': { 'password': "Password incorrect" } });
  //   // }

  //   var passwordStatus = await bcrypt.compareSync(
  //     reqBody.password,
  //     checkUser.pwd
  //   );

  //   if (!passwordStatus) {
  //     loginHistory({
  //       ...reqBody.loginHistory,
  //       ...{
  //         status: "Failed",
  //         reason: "Password incorrect",
  //         userId: checkUser._id,
  //       },
  //     });
  //     return res
  //       .status(400)
  //       .json({ success: false, errors: { password: "Password incorrect" } });
  //   }

  //   if (checkUser.google2Fa && !isEmpty(checkUser.google2Fa.secret)) {
  //     if (isEmpty(reqBody.twoFACode)) {
  //       return res
  //         .status(200)
  //         .json({ success: true, status: "TWO_FA", message: "TWO_FA_CODE" });
  //     } else {
  //       let check2Fa = node2fa.verifyToken(
  //         checkUser.google2Fa.secret,
  //         reqBody.twoFACode
  //       );
  //       if (!(check2Fa && check2Fa.delta == 0)) {
  //         return res
  //           .status(400)
  //           .json({ success: false, errors: { twoFACode: "INVALID_CODE" } });
  //       }
  //     }
  //   }

  //   // if (isEmpty(reqBody.emailotp)) {
  //   //   const otpcheck = Math.floor(100000 + Math.random() * 900000);

  //   //   console.log("otpcheckotpcheckotpcheck", otpcheck);
  //   //   if (reqBody.roleType == 1) {
  //   //     await User.updateOne(
  //   //       {
  //   //         _id: checkUser._id,
  //   //       },
  //   //       {
  //   //         otp: otpcheck,
  //   //         otptime: new Date(),
  //   //       }
  //   //     );

  //   //     let content = {
  //   //       email: checkUser.email,
  //   //       otp: otpcheck,
  //   //     };
  //   //     mailTemplateLang({
  //   //       userId: checkUser._id,
  //   //       identifier: "User_login_otp",
  //   //       toEmail: checkUser.email,
  //   //       content,
  //   //     });

  //   //     return res.status(200).json({
  //   //       success: true,
  //   //       status: "EMAIL_OTP_NOTIFY",
  //   //       message: "Enter OTP Received on Mail",
  //   //     });
  //   //   }

  //   //   if (reqBody.roleType == 2) {
  //   //     await User.updateOne(
  //   //       {
  //   //         _id: checkUser._id,
  //   //       },
  //   //       {
  //   //         otp: otpcheck,
  //   //         otptime: new Date(),
  //   //       }
  //   //     );

  //   //     let smsContent = {
  //   //       to: reqBody.phoneNo,
  //   //       body: "Your " + config.SITE_NAME + " OTP Code is: " + otpcheck,
  //   //     };
  //   //     console.log("content----", smsContent);
  //   //     console.log("otp---", otpcheck);
  //   //     var smsstate = sentSms(smsContent);

  //   //     return res.status(200).json({
  //   //       success: true,
  //   //       status: "EMAIL_OTP_NOTIFY",
  //   //       message: "Enter OTP Received on Phone",
  //   //     });
  //   //   }
  //   // }

  //   if (isEmpty(reqBody.emailotp)) {
  //     if (reqBody.email == "apptest@mudra.com") {
  //       var otpcheck = 123456;
  //     } else {
  //       var otpcheck = Math.floor(100000 + Math.random() * 900000);
  //     }

  //     console.log("otpcheckotpcheckotpcheck", otpcheck);

  //     await User.updateOne(
  //       {
  //         _id: checkUser._id,
  //       },
  //       {
  //         otp: otpcheck,
  //         otptime: new Date(),
  //       }
  //     );

  //     let content = {
  //       email: checkUser.email,
  //       otp: otpcheck,
  //     };
  //     mailTemplateLang({
  //       userId: checkUser._id,
  //       identifier: "User_login_otp",
  //       toEmail: checkUser.email,
  //       content,
  //     });
  //     return res.status(200).json({
  //       success: true,
  //       status: "EMAIL_OTP_NOTIFY",
  //       message: "Enter OTP Received on Mail",
  //     });
  //   }

  //   if (!isEmpty(reqBody.emailotp)) {
  //     let otpTime = new Date(new Date().getTime() - 120000); //2 min
  //     if (checkUser.otptime <= otpTime) {
  //       return res
  //         .status(400)
  //         .json({ success: false, errors: { emailotp: "OTP_EXPIRED" } });
  //     }

  //     if (checkUser.otp != reqBody.emailotp) {
  //       return res
  //         .status(400)
  //         .json({ success: false, errors: { emailotp: "INVALID_OTP" } });
  //     }

  //     checkUser.otp = "";
  //     checkUser.otptime = null;
  //     await checkUser.save();
  //   }

  //   let payloadData = {
  //     _id: checkUser._id,
  //   };
  //   let token = new User().generateJWT(payloadData);

  //   if (isLoginHistory) {
  //     loginHistory({
  //       ...reqBody.loginHistory,
  //       ...{ status: "Success", reason: "", userId: checkUser._id },
  //     });
  //   }

  //   if (checkUser.loginhistory.length > 0) {
  //     lastLoginDate = checkUser.loginhistory[checkUser.loginhistory.length - 1];
  //   }

  //   newNotification({
  //     userId: checkUser._id,
  //     type: "login",
  //     description: "last login",
  //     createdAt: new Date(),
  //   });
  //   let content = {
  //     broswername: reqBody.loginHistory && reqBody.loginHistory.broswername,
  //     ipaddress: reqBody.loginHistory && reqBody.loginHistory.ipaddress,
  //     countryName: reqBody.loginHistory && reqBody.loginHistory.countryName,
  //     date: new Date(),
  //   };

  //   mailTemplateLang({
  //     userId: checkUser._id,
  //     identifier: "Login_notification",
  //     toEmail: checkUser.email,
  //     content,
  //   });

  //   // mailTemplate('Login_notification', reqBody.langCode, checkUser.email, content)
  //   let result = userProfileDetail(checkUser);
  //   let userSetting = await UserSetting.findOne(
  //     { userId: checkUser._id },
  //     {
  //       _id: 0,
  //       theme: 1,
  //       afterLogin: 1,
  //     }
  //   );

  //   return res.status(200).json({
  //     success: true,
  //     status: "SUCCESS",
  //     message: "Login successfully",
  //     token,
  //     result,
  //     userSetting,
  //   });
  // } catch (err) {
  //   console.log("errerss", err);
  //   return res.status(500).json({ success: false, message: "Error on server" });
  // }
};

export const resendOtp = async (req, res) => {
  try {
    let reqBody = req.body;

    let lastLoginDate = "";

    if (reqBody.roleType == 1) {
      reqBody.email = reqBody.email.toLowerCase();
      var checkUser = await User.findOne({ email: reqBody.email }).lean();
      if (!checkUser) {
        return res
          .status(404)
          .json({ success: false, errors: { email: "Email not found" } });
      }
      if (reqBody.email == "apptest@mudra.com") {
        var otpcheck = 123456;
      } else {
        var otpcheck = Math.floor(100000 + Math.random() * 900000);
      }

      console.log("otpcheckotpcheckotpcheck", otpcheck);

      await User.updateOne(
        {
          _id: checkUser._id,
        },
        {
          otp: otpcheck,
          otptime: new Date(),
        }
      );

      let content = {
        email: checkUser.email,
        otp: otpcheck,
      };
      mailTemplateLang({
        userId: checkUser._id,
        identifier: "User_login_otp",
        toEmail: checkUser.email,
        content,
      });
      return res.status(200).json({
        success: true,
        status: "EMAIL_OTP_NOTIFY",
        message: "Enter OTP Received on Mail",
        remainingTime: new Date(),
      });
    } else if (reqBody.roleType == 2) {
      var userData = await User.findOne({ phoneNo: reqBody.phoneNo });
      if (!userData) {
        return res.status(404).json({
          success: false,
          errors: { phoneNo: "Phone number not found" },
        });
      }
      let smsOtp = Math.floor(100000 + Math.random() * 900000);
      let smsContent = {
        to: userData.phoneNo,
        body: "Your " + config.SITE_NAME + " OTP Code is: " + smsOtp,
      };

      userData.otp = smsOtp;
      userData.otptime = new Date();
      await userData.save();
      console.log("resendOtpresendOtpresendOtpresendOtp", smsContent);
      var smsstate = sentSms(smsContent);
      if (!smsstate) {
        return res.status(400).json({
          success: false,
          errors: { phoneNo: "Invalid Mobile No" },
          message: "Invalid Mobile No",
        });
      }
      return res.status(200).json({
        success: true,
        status: "EMAIL_OTP_NOTIFY",
        message: "OTP Resend to your mobile no",
        remainingTime: new Date(),
      });
    }
  } catch (err) {
    console.log("errerss", err);
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};
export const ICOlogin = async (req, res) => {
  try {
    let reqBody = req.body;

    var jwttokenico = await decryptString(reqBody.authToken, true);

    var newtoken = jwttokenico.replace("Bearer ", "");

    const decoded = jwt_decode(newtoken);

    var icouserid = decoded._id;

    let checkUser = await User.findOne({ _id: icouserid });

    if (!checkUser) {
      return res
        .status(404)
        .json({ success: false, errors: { email: "Email not found" } });
    }

    let payloadData = {
      _id: checkUser._id,
    };
    let token = new User().generateJWT(payloadData);

    let result = userProfileDetail(checkUser);
    let userSetting = await UserSetting.findOne(
      { userId: checkUser._id },
      {
        _id: 0,
        theme: 1,
      }
    );

    return res.status(200).json({
      success: true,
      status: "SUCCESS",
      messages: "Login successfully",
      token,
      result,
      userSetting,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

const loginHistory = ({
  countryName,
  countryCode,
  ipaddress,
  region, // regionName
  broswername,
  ismobile,
  os,
  status,
  reason,
  userId,
}) => {
  let data = {
    countryName,
    countryCode,
    ipaddress,
    regionName: region,
    broswername,
    ismobile,
    os,
    status,
    reason,
  };

  User.update(
    { _id: userId },
    {
      $push: {
        loginhistory: data,
      },
    },
    (err, data) => { }
  );
};

/**
 * Get User Profile
 * METHOD : GET
 * URL : /api/userProfile
 */
export const getUserProfile = (req, res) => {
  User.findById(req.user.id, (err, userData) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, errors: { messages: "Error on server" } });
    }
    let result = userProfileDetail(userData);

    return res.status(200).json({ success: true, result: result });
  });
};

/**
 * Edit User Profile
 * METHOD : PUT
 * URL : /api/userProfile
 * BODY : firstName,lastName,blockNo,address,country,state,city,postalCode
 */
export const editUserProfile = async (req, res) => {
  try {
    let reqBody = req.body;
    let userData = await User.findById(req.user.id);

    userData.firstName = reqBody.firstName;
    userData.lastName = reqBody.lastName;
    userData.blockNo = reqBody.blockNo;
    userData.address = reqBody.address;
    userData.country = reqBody.country;
    userData.state = reqBody.state;
    userData.city = reqBody.city;
    userData.postalCode = reqBody.postalCode;

    let updateUserData = await userData.save();
    let result = userProfileDetail(updateUserData);

    return res.status(200).json({
      success: false,
      message: "PROFILE_EDIT_SUCCESS",
      result: result,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

const userProfileDetail = (userData) => {

  let data = {
    userId: userData._id,
    uniqueId: userData.uniqueId,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    blockNo: userData.blockNo,
    address: userData.address,
    city: userData.city,
    state: userData.state,
    country: userData.country,
    postalCode: userData.postalCode,
    emailStatus: userData.emailStatus,
    phoneStatus: userData.phoneStatus,
    phoneCode: userData.phoneCode,
    phoneNo: userData.phoneNo,
    type: userData.type,
    profile: userData.profile,
    referencecode: userData.referencecode,
    newEmail: userData.newEmail,

    twoFAStatus: !isEmpty(userData.google2Fa.secret) ? "enabled" : "disabled",
    createAt: moment(userData.createdAt).format("DD MMM YYYY"),
    loginHistory:
      userData.loginhistory && userData.loginhistory.slice(-1).length > 0
        ? userData.loginhistory.slice(-1)[0]
        : {},
    bankDetail: {},
  };

  if (userData.bankDetails && userData.bankDetails.length > 0) {
    let bankDetail = userData.bankDetails.find((el) => el.isPrimary == true);
    if (bankDetail) {
      data.bankDetail["bankName"] = bankDetail.bankName;
      data.bankDetail["accountNo"] = bankDetail.accountNo;
      data.bankDetail["holderName"] = bankDetail.holderName;
      data.bankDetail["bankcode"] = bankDetail.bankcode;
      data.bankDetail["country"] = bankDetail.country;
      data.bankDetail["city"] = bankDetail.city;
    }
  }

  return data;
};

export const editUserProfilewithimage = async (req, res) => {
  try {
    console.log(
      "editUserProfilewithimageeditUserProfilewithimageeditUserProfilewithimage",
      req.files,
      req.file
    );
    let reqBody = req.body;
    let userData = await User.findById(req.user.id);

    userData.firstName = reqBody.firstName;
    userData.lastName = reqBody.lastName;
    userData.blockNo = reqBody.blockNo;
    userData.address = reqBody.address;
    userData.country = reqBody.country;
    userData.state = reqBody.state;
    userData.city = reqBody.city;
    userData.postalCode = reqBody.postalCode;
    if (req.file) {
      userData.profile = req.file.filename;
    }
    let updateUserData = await userData.save();
    let result = userProfileDetail(updateUserData);

    return res.status(200).json({
      success: false,
      message: "PROFILE_EDIT_SUCCESS",
      result: result,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

// const userProfileDetail = (userData) => {
//   console.log(userData, "dfsfsf lsdfksfksf");
//   let data = {
//     userId: userData._id,
//     uniqueId: userData.uniqueId,
//     firstName: userData.firstName,
//     lastName: userData.lastName,
//     email: userData.email,
//     blockNo: userData.blockNo,
//     address: userData.address,
//     city: userData.city,
//     state: userData.state,
//     country: userData.country,
//     postalCode: userData.postalCode,
//     emailStatus: userData.emailStatus,
//     phoneStatus: userData.phoneStatus,
//     phoneCode: userData.phoneCode,
//     phoneNo: userData.phoneNo,
//     type: userData.type,
//     referencecode: userData.referencecode,

//     twoFAStatus: !isEmpty(userData.google2Fa.secret) ? "enabled" : "disabled",
//     createAt: moment(userData.createdAt).format("DD MMM YYYY"),
//     loginHistory:
//       userData.loginhistory && userData.loginhistory.slice(-1).length > 0
//         ? userData.loginhistory.slice(-1)[0]
//         : {},
//     bankDetail: {},
//   };

//   if (userData.bankDetails && userData.bankDetails.length > 0) {
//     let bankDetail = userData.bankDetails.find((el) => el.isPrimary == true);
//     if (bankDetail) {
//       data.bankDetail["bankName"] = bankDetail.bankName;
//       data.bankDetail["accountNo"] = bankDetail.accountNo;
//       data.bankDetail["holderName"] = bankDetail.holderName;
//       data.bankDetail["bankcode"] = bankDetail.bankcode;
//       data.bankDetail["country"] = bankDetail.country;
//       data.bankDetail["city"] = bankDetail.city;
//     }
//   }

//   return data;
// };
/**
 * Update Bank Detail
 * METHOD : POST
 * URL : /api/bankdetail
 * BODY : bankId, bankName,accountNo,holderName,bankcode,country,city,bankAddress,currencyId
 */
export const updateBankDetail = async (req, res) => {
  try {
    let bankDetailsArr = [],
      reqBody = req.body;
    let message = "";
    let userData = await User.findOne({ _id: req.user.id });

    let currencyData = await Currency.findById(reqBody.currencyId).lean();
    if (!currencyData) {
      return res
        .status(500)
        .json({ success: false, errors: { currencyId: "Invalid Currency" } });
    }

    if (
      !isEmpty(reqBody.bankId) &&
      mongoose.Types.ObjectId.isValid(reqBody.bankId)
    ) {
      let bankData = userData.bankDetails.id(reqBody.bankId);

      if (bankData.isPrimary == false && reqBody.isPrimary == true) {
        let isPrimaryId = userData.bankDetails.find(
          (el) => el.isPrimary == true
        );
        if (isPrimaryId) {
          let isPrimaryData = userData.bankDetails.id(isPrimaryId);
          isPrimaryData.isPrimary = false;
        }
      } else if (bankData.isPrimary == true && reqBody.isPrimary == false) {
        reqBody.isPrimary = true;
      }

      bankData.bankName = reqBody.bankName;
      bankData.accountNo = reqBody.accountNo;
      bankData.holderName = reqBody.holderName;
      bankData.bankcode = reqBody.bankcode;
      bankData.country = reqBody.country;
      bankData.city = reqBody.city;
      bankData.bankAddress = reqBody.bankAddress;
      bankData.currencyId = reqBody.currencyId;
      bankData.currencySymbol = currencyData.currencySymbol;
      bankData.isPrimary = reqBody.isPrimary;
      message = "BANK_EDIT_SUCCESS";
    } else {
      if (userData.bankDetails && userData.bankDetails.length > 0) {
        bankDetailsArr = userData.bankDetails;

        if (reqBody.isPrimary == true) {
          let bankDetails = userData.bankDetails.find(
            (el) => el.isPrimary == true
          );
          let bankData = userData.bankDetails.id(bankDetails._id);
          bankData.isPrimary = false;
        }

        bankDetailsArr.push({
          bankName: reqBody.bankName,
          accountNo: reqBody.accountNo,
          holderName: reqBody.holderName,
          bankcode: reqBody.bankcode,
          country: reqBody.country,
          city: reqBody.city,
          bankAddress: reqBody.bankAddress,
          currencyId: reqBody.currencyId,
          currencySymbol: currencyData.currencySymbol,
          isPrimary: reqBody.isPrimary,
        });
      } else {
        bankDetailsArr.push({
          bankName: reqBody.bankName,
          accountNo: reqBody.accountNo,
          holderName: reqBody.holderName,
          bankcode: reqBody.bankcode,
          country: reqBody.country,
          city: reqBody.city,
          bankAddress: reqBody.bankAddress,
          currencyId: reqBody.currencyId,
          currencySymbol: currencyData.currencySymbol,
          isPrimary: true,
        });
      }
      userData.bankDetails = bankDetailsArr;
      message = "BANK_ADD_SUCCESS";
    }

    let updateData = await userData.save();

    return res.status(200).json({
      success: true,
      message: message,
      result: updateData.bankDetails,
    });
  } catch (err) {
    console.log("----Error", err);
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

/**
 * GET Bank Detail
 * METHOD : GET
 * URL : /api/bankdetail
 */
export const getBankDetail = (req, res) => {
  User.findById(
    req.user.id,
    {
      "bankDetails._id": 1,
      "bankDetails.bankName": 1,
      "bankDetails.holderName": 1,
      "bankDetails.accountNo": 1,
      "bankDetails.bankcode": 1,
      "bankDetails.country": 1,
      "bankDetails.city": 1,
      "bankDetails.bankAddress": 1,
      "bankDetails.currencyId": 1,
      "bankDetails.currencySymbol": 1,
      "bankDetails.isPrimary": 1,
    },
    (err, userData) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Error on server" });
      }
      return res.status(200).json({
        success: true,
        message: "Success",
        result: userData.bankDetails,
      });
    }
  );
};

/**
 * Delete Bank Detail
 * METHOD : PUT
 * URL : /api/bankdetail
 * BODY : bankId
 */
export const deleteBankDetail = async (req, res) => {
  try {
    let reqBody = req.body;
    let userData = await User.findById(req.user.id);

    let bankDataRemove = userData.bankDetails.id(reqBody.bankId);
    if (bankDataRemove.isPrimary) {
      return res.status(400).json({ success: false, message: "Can't delete primary account" });
    }
    if (bankDataRemove.isPrimary) {
      let bankDetails = userData.bankDetails.find(
        (el) => el._id.toString() != reqBody.bankId
      );
      if (bankDetails) {
        let bankData = userData.bankDetails.id(bankDetails._id);
        bankData.isPrimary = true;
      }
    }

    bankDataRemove.remove();
    let updateData = await userData.save();

    return res.status(200).json({
      success: true,
      message: "BANK_DELETE_SUCCESS",
      result: updateData.bankDetails,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

/**
 * Set Primary Bank
 * METHOD : PATCH
 * URL : /api/bankdetail
 * BODY : bankId
 */
export const setPrimaryBank = async (req, res) => {
  try {
    let reqBody = req.body;
    let userData = await User.findOne({ _id: req.user.id });

    let bankData = userData.bankDetails.id(reqBody.bankId);
    if (!bankData) {
      return res.status(400).json({ success: false, message: "NO_DATA" });
    }

    if (!bankData.isPrimary) {
      let isPrimaryId = userData.bankDetails.find((el) => el.isPrimary == true);
      if (isPrimaryId) {
        let isPrimaryData = userData.bankDetails.id(isPrimaryId);
        isPrimaryData.isPrimary = false;
      }
      bankData.isPrimary = true;
    }

    let updateData = await userData.save();

    return res.status(200).json({
      success: true,
      message: "BANK_SET_PRIMARY_SUCCESS",
      result: updateData.bankDetails,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

/**
 * Change New Password
 * METHOD : POST
 * URL : /api/changePassword
 * BODY : password, confirmPassword, oldPassword
 */
export const changePassword = async (req, res) => {
  try {
    let reqBody = req.body;
    let userData = await User.findOne({ _id: req.user.id });
    let userSetting = await UserSetting.findOne({ userId: req.user.id }).lean();
    if (!userData) {
      return res
        .status(500)
        .json({ success: false, message: "User not found" });
    }

    // if (!userData.authenticate(reqBody.oldPassword)) {
    //     return res.status(400).json({ 'success': false, 'errors': { 'oldPassword': "PASSWORD_INCORRECT" } });
    // }

    var passwordStatus = bcrypt.compareSync(reqBody.oldPassword, userData.pwd);

    if (!passwordStatus) {
      return res.status(400).json({
        success: false,
        errors: { oldPassword: "PASSWORD_INCORRECT" },
      });
    }

    userData.password = reqBody.password;
    await userData.save();
    newNotification({
      userId: userData._id,
      type: "Change Password",
      description: "Password Changed",
    });
    if (userSetting.passwordChange) {
      mailTemplateLang({
        userId: userData._id,
        identifier: "alert_notification",
        toEmail: userData.email,
        content: "Password Changed Successfully",
      });
      return res.status(200).json({
        success: true,
        message: "Password Changed and Mail Sent Successfully",
      });
    } else {
      return res
        .status(200)
        .json({ success: true, message: "PASSWORD_CHANGE_SUCCESS" });
    }
    // return res.status(200).json({ 'success': true, 'message': "PASSWORD_CHANGE_SUCCESS" });
  } catch (err) {
    console.log("aaaaaaaaaaaaaaaaaaaa", err);
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};
/**
 * Get 2FA Code
 * METHOD : GET
 * URL : /api/security/2fa
 */
export const get2faCode = async (req, res) => {
  User.findById(req.user.id, (err, userData) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "SOMETHING_WRONG" });
    }
    let result = generateTwoFa(userData);
    return res.status(200).json({ success: true, result: result });
  });
};

/**
 * Update 2FA Code
 * METHOD : PUT
 * URL : /api/security/2fa
 * BODY : code, secret, uri
 */
export const update2faCode = async (req, res) => {
  try {
    let reqBody = req.body;

    let check2Fa = node2fa.verifyToken(reqBody.secret, reqBody.code);

    if (check2Fa && check2Fa.delta == 0) {
      let userSetting = await UserSetting.findOne({ userId: req.user.id }).lean();
      let updateData = await User.findByIdAndUpdate(
        req.user.id,
        {
          "google2Fa.secret": reqBody.secret,
          "google2Fa.uri": reqBody.uri,
        },
        { new: true }
      );
      let result = generateTwoFa(updateData);
      result['userId'] = req.user.id;
      result['code'] = reqBody.code;
      TwoFA(result)
      console.log(result, "<<< --- RESULT --- >>>");
      if (userSetting.twoFA) {
        newNotification({
          userId: updateData._id,
          type: "2FA Status",
          description: "2FA Enabled Successfully",
        });
        mailTemplateLang({
          userId: updateData._id,
          identifier: "alert_notification",
          toEmail: updateData.email,
          content: "2FA Enabled Successfully",
        });
        return res.status(200).json({
          success: true,
          message: "2FA Enabled And Mail Sent Successfully",
          result,
        });
      } else {
        newNotification({
          userId: updateData._id,
          type: "2FA Status",
          description: "2FA Enabled Successfully",
        });
        mailTemplateLang({
          userId: updateData._id,
          identifier: "alert_notification",
          toEmail: updateData.email,
          content: "2FA Enabled Successfully",
        });
        return res
          .status(200)
          .json({ success: true, message: "TWO_FA_ENABLE_SUCCESS", result });
      }
      // return res.status(200).json({ 'success': true, 'message': "TWO_FA_ENABLE_SUCCESS", result })
    }

    return res
      .status(400)
      .json({ success: false, errors: { code: "INVALID_CODE" } });
  } catch (err) {
    console.log(err, "errr");
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

async function TwoFA(data) {

  let encryptuserdata = CryptoJS.AES.encrypt(JSON.stringify(data), config.secretOrKey).toString();

  let jsoncrypt = {
    token: encryptuserdata,
  };
  try {
    console.log("config.ICOAPI", config.ICOAPI);

    let respData = await axios({
      method: "post",
      url: `${config.ICOAPI}/users/UpdateTwoFa`,
      data: jsoncrypt,
    });

    console.log("<<< ---- TwoFA RESPDATA ---- >>>", respData)
  } catch (err) {
    console.log("TwoFA-err", err)
  }
}

/**
 * Disable 2FA Code
 * METHOD : PATCH
 * URL : /api/security/2fa
 * Body : code, secret, uri
 */
export const diabled2faCode = async (req, res) => {
  try {
    let reqBody = req.body;
    let userData = await User.findOne({ _id: req.user.id });
    let userSetting = await UserSetting.findOne({ userId: req.user.id }).lean();

    if (userData.google2Fa && userData.google2Fa.secret != reqBody.secret) {
      return res
        .status(500)
        .json({ success: false, message: "SOMETHING_WRONG" });
    }

    let check2Fa = node2fa.verifyToken(reqBody.secret, reqBody.code);
    if (check2Fa && check2Fa.delta == 0) {
      userData.google2Fa.secret = "";
      userData.google2Fa.uri = "";
      let updateData = await userData.save();
      let result = generateTwoFa(updateData);
      result['userId'] = req.user.id;
      result['code'] = reqBody.code;
      TwoFA(result)
      if (userSetting.twoFA) {
        newNotification({
          userId: updateData._id,

          type: "2FA Status",
          description: "2FA Disabled Successfully",
        });
        mailTemplateLang({
          userId: userData._id,
          identifier: "alert_notification",
          toEmail: userData.email,
          content: "2FA Disabled Successfully",
        });
        return res.status(200).json({
          success: true,
          message: "2FA Disabled and Mail Sent Successfully",
          result,
        });
      } else {
        newNotification({
          userId: updateData._id,

          type: "2FA Status",
          description: "2FA Disabled Successfully",
        });
        mailTemplateLang({
          userId: userData._id,
          identifier: "alert_notification",
          toEmail: userData.email,
          content: "2FA Disabled Successfully",
        });
        return res
          .status(200)
          .json({ success: true, message: "TWO_FA_DISABLE_SUCCESS", result });
      }
      // return res.status(200).json({ 'success': true, 'message': "TWO_FA_DISABLE_SUCCESS", result })
    } else if (check2Fa && check2Fa.delta == -1) {
      return res
        .status(400)
        .json({ success: false, errors: { code: "Expired 2FA Code" } });
    }
    return res
      .status(400)
      .json({ success: false, errors: { code: "INVALID_CODE" } });
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

export const generateTwoFa = (userData) => {
  let result = {};
  if (userData && userData.google2Fa.secret != "") {
    result = {
      secret: userData.google2Fa.secret,
      imageUrl: config.NODE_TWOFA.QR_IMAGE + userData.google2Fa.uri,
      uri: userData.google2Fa.uri,
      twoFaStatus: "enabled",
    };
  } else {
    let newSecret = node2fa.generateSecret({ name: config.NODE_TWOFA.NAME, account: userData.email });
    result = {
      secret: newSecret.secret,
      imageUrl: config.NODE_TWOFA.QR_IMAGE + newSecret.uri,
      uri: newSecret.uri,
      twoFaStatus: "disabled",
    };
  }
  return result;
};

export const defaultUserSetting = async (userData) => {
  if (!isEmpty(userData)) {
    try {
      let newSetting = new UserSetting({
        userId: userData._id,
      });

      let currencyData = await Currency.findOne({
        type: "fiat" /* "isPrimary": true  */,
      });
      if (currencyData) {
        newSetting.currencySymbol = currencyData.currencySymbol;
      }

      let languageData = await Language.findOne({ isPrimary: true });
      if (languageData) {
        newSetting.languageId = languageData._id;
      }

      await newSetting.save();
    } catch (err) { }
  }
};

/**
 * Get User setting
 * METHOD : GET
 * URL: /api/userSetting
 */
export const getUserSetting = (req, res) => {
  UserSetting.findOne(
    { userId: req.user.id },
    { _id: 0, createdAt: 0, updatedAt: 0 },
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
 * Edit User Setting
 * METHOD : PUT
 * URL : /api/userSetting
 * BODY : languageId, theme, currencySymbol, timeZone(name,GMT), afterLogin(page,url)
 */
export const editUserSetting = (req, res) => {
  let reqBody = req.body;
  UserSetting.findOneAndUpdate(
    { userId: req.user.id },
    {
      languageId: reqBody.languageId,
      theme: reqBody.theme,
      currencySymbol: reqBody.currencySymbol,
      // "timeZone": reqBody.timeZone,
      afterLogin: reqBody.afterLogin,
    },
    {
      fields: { _id: 0, createdAt: 0, updatedAt: 0 },
      new: true,
    },
    (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "SOMETHING_WRONG" });
      }
      return res
        .status(200)
        .json({ success: true, message: "EDIT_SETTING_SUCCESS", result: data });
    }
  );
};

/**
 * Edit User Notification
 * METHOD : PUT
 * URL : /api/editNotif
 * BODY : name, checked
 */
export const editNotif = async (req, res) => {
  try {
    let reqBody = req.body;
    let usrSetting = await UserSetting.findOne(
      { userId: req.user.id },
      { createdAt: 0, updatedAt: 0 }
    );

    if (!usrSetting) {
      return res.status(400).json({ success: false, message: "NO_DATA" });
    }

    if (reqBody.name in usrSetting) {
      usrSetting[reqBody.name] = reqBody.checked;
    }
    let updateData = await usrSetting.save();

    return res.status(200).json({
      success: true,
      message: "EDIT_SETTING_SUCCESS",
      result: {
        currencySymbol: updateData.currencySymbol,
        theme: updateData.theme,
        afterLogin: updateData.afterLogin,
        languageId: updateData.languageId,
        timeZone: updateData.timeZone,
        twoFA: updateData.twoFA,
        passwordChange: updateData.passwordChange,
        siteNotification: updateData.siteNotification,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

/**
 * Check Forgot Password
 * METHOD : POST
 * URL : /api/forgotPassword
 * BODY : email, reCaptcha
 */
export const checkForgotPassword = async (req, res) => {
  try {
    let reqBody = req.body;

    // let recaptcha = await recaptchaFun.checkToken(reqBody.reCaptcha);
    // if (recaptcha && recaptcha.status == false) {
    //     return res.status(500).json({ "success": false, 'message': "Invalid reCaptcha" })
    // }

    if (reqBody.roleType == 1) {
      let userData = await User.findOne({ email: reqBody.email });
      if (!userData) {
        return res
          .status(400)
          .json({ success: false, errors: { email: "Email not found" } });
      }
      if (userData.status == "Deactivated") {
        // console.log("rttttttttttttttttttttt",checkUser.active)
        return res.status(400).json({
          status: false,
          message:
            "Your Account Deactivated By Admin, Please Contact Support Team",
        });
      }

      if (userData.status == "deleted") {
        // console.log("rttttttttttttttttttttt",checkUser.active)
        return res.status(400).json({
          status: false,
          message:
            "The account has been deleted.",
        });
      }
      let encryptToken = encryptString(userData._id, true);
      let content = {
        name: userData.firstName,
        confirmMailUrl: `${config.FRONT_URL}/reset-password/${encryptToken}`,
      };

      userData.mailToken = encryptToken;
      await userData.save();
      mailTemplateLang({
        userId: userData._id,
        identifier: "User_forgot",
        toEmail: userData.email,
        content,
      });

      return res.status(200).json({
        status: "success",
        message:
          "Your Reset Password link Sent to your Email account Successfully",
      });
    } else if (reqBody.roleType == 2) {
      let checkMobile = await User.findOne({ phoneNo: reqBody.phoneNo });

      if (!checkMobile) {
        return res
          .status(400)
          .json({ status: false, errors: { phoneNo: "User Not Found" } });
      }
      if (checkMobile.status == "Deactivated") {
        // console.log("rttttttttttttttttttttt",checkUser.active)
        return res.status(400).json({
          status: false,
          message:
            "Your Account Deactivated By Admin, Please Contact Support Team",
          errors: { phoneNo: "Your Account Deactivated By Admin, Please Contact Support Team" }
        });
      }
      if (checkMobile.status == "deleted") {
        // console.log("rttttttttttttttttttttt",checkUser.active)
        return res.status(400).json({
          status: false,
          message:
            "The account has been deleted.",
          errors: { phoneNo: "The account has been deleted." }
        });
      }
      let otpTime = new Date(new Date().getTime() - 120000); //2 min

      if (checkMobile.otptime <= otpTime) {
        return res
          .status(400)
          .json({ status: false, errors: { otp: "Expiry OTP" } });
      }

      if (checkMobile.otp != reqBody.otp) {
        return res
          .status(400)
          .json({ status: false, errors: { otp: "Invalid OTP" } });
      }

      let encryptToken = encryptString(checkMobile._id, true);

      checkMobile.mailToken = encryptToken;
      checkMobile.otp = "";
      await checkMobile.save();

      return res.status(200).json({
        status: "MOBILE_USER",
        message: "OTP is verified",
        userToken: encryptToken,
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING WRONG" });
  }
};


export const resetPasswordexpiry = async (req, res) => {
  try {
    let reqBody = req.body;

    let userId = decryptString(reqBody.authToken, true);
    let userData = await User.findById(userId);
    if (!userData) {
      return res.status(500).json({ success: false, message: "NOT_FOUND" });
    }

    if (!(userData.mailToken == reqBody.authToken)) {
      return res
        .status(400)
        .json({ success: false, message: "Your link was expiry" });
    }
  } catch (err) {
    console.log(err, "errrr  jdsfjdfs");
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

/**
 * Reset Password
 * METHOD : POST
 * URL : /api/resetPassword
 * BODY : password, confirmPassword, authToken
 */
export const resetPassword = async (req, res) => {
  try {
    let reqBody = req.body;
    let userId = decryptString(reqBody.authToken, true);
    let userData = await User.findOne({ _id: userId });
    if (!userData) {
      return res.status(500).json({ success: false, message: "NOT_FOUND" });
    }

    if (!(userData.mailToken == reqBody.authToken)) {
      return res
        .status(400)
        .json({ success: false, message: "Your link was expiry" });
    }

    userData.password = reqBody.password;
    // userData.pwd = reqBody.password;
    userData.mailToken = "";
    await userData.save();

    return res
      .status(200)
      .json({ success: true, message: "Updated successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

/**
 * User Upgrade
 * METHOD : POST
 * URL : /api/upgradeUser
 * BODY : upgradeType(basic,advanced,pro)
 */
export const upgradeUser = async (req, res) => {
  try {
    let reqBody = req.body;
    let userData = await User.findOne({ _id: req.user.id });
    if (!userData) {
      return res.status(400).json({ success: false, message: "NO_DATA" });
    }

    let usrKyc = await UserKyc.findOne(
      { userId: req.user.id },
      { idProof: 1, addressProof: 1 }
    );

    if (!usrKyc) {
      return res.status(400).json({ success: false, message: "NO_DATA" });
    }

    if (
      usrKyc &&
      usrKyc.idProof.status == "approved" &&
      usrKyc.addressProof.status == "approved"
    ) {
      if (
        userData.type == "not_activate" &&
        ["advanced", "pro"].includes(reqBody.upgradeType)
      ) {
        return res.status(400).json({
          success: false,
          message: "You should first verify the BASIC suer account",
        });
      } else if (
        userData.type == "basic" &&
        ["pro"].includes(reqBody.upgradeType)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You should first verify the Basic and the Advanced user account",
        });
      } else if (
        ["basic_processing", "advanced_processing", "pro_processing"].includes(
          userData.type
        )
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Your request are procesing" });
      } else if (
        userData.type == "not_activate" &&
        reqBody.upgradeType == "basic"
      ) {
        userData.type = "basic_processing";
        let updateDoc = await userData.save();

        let result = userProfileDetail(updateDoc);
        return res
          .status(200)
          .json({ success: true, message: "Successfully submitted", result });
      } else if (
        userData.type == "basic" &&
        reqBody.upgradeType == "advanced"
      ) {
        userData.type = "advanced_processing";
        let updateDoc = await userData.save();

        let result = userProfileDetail(updateDoc);
        return res
          .status(200)
          .json({ success: true, message: "Successfully submitted", result });
      } else if (userData.type == "advanced" && reqBody.upgradeType == "pro") {
        userData.type = "pro_processing";
        let updateDoc = await userData.save();

        let result = userProfileDetail(updateDoc);
        return res
          .status(200)
          .json({ success: true, message: "Successfully submitted", result });
      }
    }

    return res
      .status(400)
      .json({ success: false, message: "Please verify the kyc" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};
//alalaguraja work
/**
 * Change New Phone
 * METHOD : POST
 * URL : /api/phoneChange
 * BODY : newPhoneCode, newPhoneNo
 */
// export const changeNewPhone = async (req, res) => {
//   try {
//     let reqBody = req.body,
//       smsOtp = Math.floor(100000 + Math.random() * 900000);

//     // let numValidation = await numverify.validation(reqBody.newPhoneCode + reqBody.newPhoneNo);
//     // if (!numValidation.valid) {
//     //     return res.status(400).json({ "success": false, 'errors': { 'newPhoneNo': "Incorrect format" } })
//     // }

//     let checkUser = await User.findOne({
//       phoneCode: reqBody.newPhoneCode,
//       phoneNo: reqBody.newPhoneNo,
//     });
//     if (checkUser) {
//       if (checkUser._id.toString() != req.user.id) {
//         return res.status(400).json({
//           success: false,
//           errors: { newPhoneNo: "Phone number already exists" },
//         });
//       }
//       if (checkUser._id.toString() == req.user.id) {
//         return res.status(400).json({
//           success: false,
//           errors: { newPhoneNo: "Does matched your previous mobile number" },
//         });
//       }
//     }

//     let siteSetting = await SiteSetting.findOne({}, { siteName: 1 });
//     if (!siteSetting) {
//       return res
//         .status(500)
//         .json({ success: false, message: "SOMETHING_WRONG" });
//     }

//     let smsContent = {
//       to: `+${reqBody.newPhoneCode}${reqBody.newPhoneNo}`,
//       body: "Your " + siteSetting.siteName + " OTP Code is: " + smsOtp,
//     };

//     let { smsStatus } = await sentSms(smsContent);
//     if (!smsStatus) {
//       return res
//         .status(500)
//         .json({ success: false, message: "SOMETHING_WRONG" });
//     }

//     await User.updateOne(
//       {
//         _id: req.user.id,
//       },
//       {
//         newPhone: {
//           phoneCode: reqBody.newPhoneCode,
//           phoneNo: reqBody.newPhoneNo,
//         },
//         otp: smsOtp,
//         otptime: new Date(),
//       }
//     );
//     return res.status(200).json({
//       success: true,
//       message: "OTP sent successfully, It is only valid for 2 minutes",
//     });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
//   }
// };

// /**
//  * Verify New Phone
//  * METHOD : PUT
//  * URL : /api/phoneChange
//  * BODY : otp
//  */
// export const verifyNewPhone = async (req, res) => {
//   try {
//     let reqBody = req.body,
//       otpTime = new Date(new Date().getTime() - 120000); //2 min
//     let userData = await User.findOne({ _id: req.user.id });

//     if (userData.otptime <= otpTime) {
//       return res
//         .status(400)
//         .json({ success: false, errors: { otp: "Expiry OTP" } });
//     }

//     if (userData.otp != reqBody.otp) {
//       return res
//         .status(400)
//         .json({ success: false, errors: { otp: "Invalid OTP" } });
//     }

//     if (userData.newPhone.phoneCode == "" || userData.newPhone.phoneNo == "") {
//       return res
//         .status(400)
//         .json({ success: false, errors: { otp: "Invalid new phone" } });
//     }

//     let checkUser = await User.findOne({
//       phoneCode: userData.newPhone.phoneCode,
//       phoneNo: userData.newPhone.phoneNo,
//       _id: { $ne: req.user.id },
//     });
//     if (checkUser) {
//       return res
//         .status(401)
//         .json({ success: false, message: "Phone number already exists" });
//     }

//     userData.phoneCode = userData.newPhone.phoneCode;
//     userData.phoneNo = userData.newPhone.phoneNo;
//     userData.newPhone.phoneCode = "";
//     userData.newPhone.phoneNo = "";
//     userData.newPhone.otp = "";
//     userData.phoneStatus = "verified";

//     let updateUserData = await userData.save();

//     let responseData = {
//       phoneCode: updateUserData.phoneCode,
//       phoneNo: updateUserData.phoneNo,
//       phoneStatus: updateUserData.phoneStatus,
//     };
//     return res.status(200).json({
//       status: true,
//       message: "Mobile phone verified",
//       result: responseData,
//     });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
//   }
// };

//antonychanage

export const changeNewPhone = async (req, res) => {
  try {
    let reqBody = req.body,
      smsOtp = Math.floor(100000 + Math.random() * 900000);

    // let numValidation = await numverify.validation(reqBody.newPhoneCode + reqBody.newPhoneNo);
    // if (!numValidation.valid) {
    //     return res.status(400).json({ "success": false, 'errors': { 'newPhoneNo': "Incorrect format" } })
    // }

    let checkUser = await User.findOne({
      // phoneCode: reqBody.newPhoneCode,
      phoneNo: "+" + reqBody.newPhoneCode + reqBody.newPhoneNo,
    });

    if (checkUser) {
      if (checkUser.status == 'deleted') {
        return res
          .status(400)
          .json({ success: false, errors: { newPhoneNo: "The phone no is disabled for update" } });
      } else if (checkUser._id.toString() != req.user.id) {
        return res.status(400).json({
          success: false,
          errors: { newPhoneNo: "Phone number already exists" },
        });
      } else if (checkUser._id.toString() == req.user.id) {
        return res.status(400).json({
          success: false,
          errors: { newPhoneNo: "Does matched your previous mobile number" },
        });
      }
    }

    let siteSetting = await SiteSetting.findOne({}, { siteName: 1 }).lean();
    if (!siteSetting) {
      return res
        .status(500)
        .json({ success: false, message: "SOMETHING_WRONG" });
    }

    let smsContent = {
      to: `+${reqBody.newPhoneCode}${reqBody.newPhoneNo}`,
      body: "Your " + siteSetting.siteName + " OTP Code is: " + smsOtp,
    };

    let { smsStatus } = await sentSms(smsContent);
    if (!smsStatus) {
      return res
        .status(500)
        .json({ success: false, message: "Invalid Mobile No" });
    }
    console.log(
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "+" + reqBody.newPhoneCode + reqBody.newPhoneNo,
      smsContent
    );
    await User.updateOne(
      {
        _id: req.user.id,
      },
      {
        newPhone: {
          phoneCode: reqBody.newPhoneCode,
          phoneNo: "+" + reqBody.newPhoneCode + reqBody.newPhoneNo,
        },
        otp: smsOtp,
        otptime: new Date(),
      }
    );
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully, It is only valid for 2 minutes",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

/**
 * Verify New Phone
 * METHOD : PUT
 * URL : /api/phoneChange
 * BODY : otp
 */
export const verifyNewPhone = async (req, res) => {
  try {
    let reqBody = req.body,
      otpTime = new Date(new Date().getTime() - 120000); //2 min
    let userData = await User.findOne({ _id: req.user.id });

    if (userData.otptime <= otpTime) {
      return res
        .status(400)
        .json({ success: false, errors: { otp: "Expiry OTP" } });
    }

    if (userData.otp != reqBody.otp) {
      return res
        .status(400)
        .json({ success: false, errors: { otp: "Invalid OTP" } });
    }

    if (userData.newPhone.phoneCode == "" || userData.newPhone.phoneNo == "") {
      return res
        .status(400)
        .json({ success: false, errors: { otp: "Invalid new phone" } });
    }

    let checkUser = await User.findOne({
      phoneCode: userData.newPhone.phoneCode,
      phoneNo: "+" + userData.newPhone.phoneCode + userData.newPhone.phoneNo,
      _id: { $ne: req.user.id },
    });
    if (checkUser) {
      return res
        .status(401)
        .json({ success: false, message: "Phone number already exists" });
    }

    userData.phoneCode = userData.newPhone.phoneCode;
    userData.phoneNo = userData.newPhone.phoneNo;
    userData.newPhone.phoneCode = "";
    userData.newPhone.phoneNo = "";
    userData.newPhone.otp = "";
    userData.phoneStatus = "verified";

    let updateUserData = await userData.save();

    let responseData = {
      phoneCode: updateUserData.phoneCode,
      phoneNo: updateUserData.phoneNo,
      phoneStatus: updateUserData.phoneStatus,
    };
    newNotification({
      userId: updateUserData._id,
      type: "Change Mobile Number",
      description: "update Mobile Number Successfully",
    });
    return res.status(200).json({
      status: true,
      message: "Mobile phone verified",
      result: responseData,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};
/**
 * Get User List
 * METHOD : Get
 * URL : /adminapi/user
 */
export const getUserList = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let filter = filterSearchQuery(req.query, [
      "email",
      "status",
      "active",
      "phoneNo",
      "lastName",
      "firstName",
      "address"
    ]);

    let count = await User.countDocuments(filter);
    let data = await User.find(filter, {
      email: 1,
      status: 1,
      createdAt: 1,
      google2Fa: 1,
      firstName: 1,
      phoneNo: 1,
      address: 1,
      phoneCode: 1,
      lastName: 1,
      uniqueId: 1,
      _id: 1,
    })
      .sort({ _id: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);

    let result = {
      count,
      data,
    };
    return res.status(200).json({ success: true, messages: "success", result });
  } catch (err) {
    res.status(500).json({ success: false, message: "error on server" });
  }
};
export const getUserListforairdrop = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let filter = filterSearchQuery(req.query, ["email", "status"]);

    let count = await User.countDocuments(filter);
    let data = await User.find(filter, {
      email: 1,
      status: 1,
      createdAt: 1,
      google2Fa: 1,
    });
    // .skip(pagination.skip)
    // .limit(pagination.limit);

    let result = {
      count,
      data,
    };
    return res.status(200).json({ success: true, messages: "success", result });
  } catch (err) {
    res.status(500).json({ success: false, message: "error on server" });
  }
};
/**
 * changeStatus
 * METHOD : Post
 * URL : /adminapi/changeStatus
 */
export const changeStatus = async (req, res) => {
  try {
    let status;
    let updateData;
    let data = await User.findById(req.body._id).lean();
    if (data.status == "verified") {
      updateData = {
        status: "Deactivated",
      };
      status = "Deactivated";
    } else {
      updateData = {
        status: "verified",
      };
      status = "Activated";
    }
    let userUpdate = await User.findByIdAndUpdate(
      { _id: req.body._id },
      { $set: updateData },
      { new: true }
    );
    let result = {
      userUpdate,
    };
    return res
      .status(200)
      .json({ success: true, messages: status + " success", result });
  } catch (err) {
    console.log(err, "errrrrrrrrrrrrr");
    res.status(500).json({ success: false, message: "error on server" });
  }
};

/**
 * changeTwofa
 * METHOD : Post
 * URL : /adminapi/change2Fa
 */
export const changeTwofa = async (req, res) => {
  try {
    let data = await User.findById(req.body._id);
    if (data.google2Fa.secret != "" && data.google2Fa.uri != "") {
      data.google2Fa.secret = "";
      data.google2Fa.uri = "";
      let updateData = await data.save();

      UserTWOFA({ userId: req.body._id })
      return res.status(200).json({ success: true, messages: "2FA Disabled" });
    } else {
      return res
        .status(200)
        .json({ success: true, messages: "2FA Already Disabled" });
    }
  } catch (err) {
    console.log(err, "oeroeorerers");
    res.status(500).json({ success: false, message: "error on server" });
  }
};

async function UserTWOFA(data) {

  let encryptuserdata = CryptoJS.AES.encrypt(JSON.stringify(data), config.secretOrKey).toString();

  let jsoncrypt = {
    token: encryptuserdata,
  };
  try {


    let respData = await axios({
      method: "post",
      url: `${config.ICOAPI}/users/disableTwoFa`,
      data: jsoncrypt,
    });

    console.log("<<< ---- TwoFA RESPDATA ---- >>>", respData)
  } catch (err) {
    console.log("TwoFA-err", err)
  }
}

/**
 * Get Balance List
 * METHOD : Get
 * URL : /adminapi/getUserBalanceList
 */
export const getUserBalanceList = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let filter = req.query.search
    let { sortOrder, offset, limit, download } = req.body;
    let sortBy = {};

    limit = parseInt(req.body.limit);

    let search = {};
    let userSearch = {};
    let currencySearch = {};
    if (filter) {
      let searchColumns = [
        { name: { $round: ["$spotwallet", 8] }, type: "number" },
        { name: { $round: ["$p2pbalance", 8] }, type: "number" }
      ];
      search = searchQuery(searchColumns, filter);

      let userSearchColumns = [
        { name: "$email", type: "string" },
        { name: { $concat: ["+", "$phoneCode", "$phoneNo"] }, type: "string" }
      ];
      userSearch = searchQuery(userSearchColumns, filter);

      let currencySearchColumns = [{ name: "$currencySymbol", type: "string" }];
      currencySearch = searchQuery(currencySearchColumns, filter);
    }

    async.parallel({
      user: function (callback) {
        User.find(userSearch, callback).distinct("_id");

      },
      currency: function (callback) {
        Currency.find(currencySearch, callback).distinct("_id");
      }
    }, async function (err, result) {

      if (filter) {
        search["$expr"]["$or"].push({
          $in: ["$userId", result.user]
        },
          {
            $in: ["$currency", result.currency]
          });
      }
      search["$or"] = [{
        "spotwallet": { $gt: 0 },
      },
      {
        "p2pbalance": { $gt: 0 },
      }]





      if (!download)
        var totalCount = await Assets.countDocuments(search);


      Assets.find(search, {
        spotwallet: { $round: ["$spotwallet", 8] },
        p2pbalance: { $round: ["$p2pbalance", 8] }
      }).populate([{
        path: "userId", select: { email: 1, phoneCode: 1, phoneNo: 1, uniqueId: 1 }
      },
      {
        path: "currency", select: { currencySymbol: 1 }
      }]).sort({ _id: -1 }).skip(pagination.skip).limit(pagination.limit).exec(function (err, history) {
        if (err) {

          return res.status(400).json({ status: false, message: "Error occured" });
        } else {

          return res.status(200).json({ status: true, data: history, count: totalCount });
        }
      });
    });


  } catch (err) {
    console.log("getUserBalanceList", err);
    res.status(500).json({ success: false, message: "error on server" });
  }
};
/**
 * Get Balance List
 * METHOD : Get
 * URL : /adminapi/getUserBalanceList
 */
export const getSingleUserAssetDetails = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let search = {};
    if (!isEmpty(req.query.search)) {
      let searchColumns = [
        { name: "$currencySymbol", type: "string" },
        { name: "$spotwallet", type: "number" },
        { name: "$p2pbalance", type: "number" },
      ];
      search = searchQuery(searchColumns, req.query.search);
    }
    search.userId = ObjectId(req.query.userId)

    let count = await Assets.countDocuments(search)

    let data = await Assets.find(search).skip(pagination.skip).limit(pagination.limit).populate({ path: "userId", select: { email: 1, phoneCode: 1, phoneNo: 1, uniqueId: 1 } })
    let result = {
      data,
      count: count,
    };

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.log("getUserBalanceList", err);
    res.status(500).json({ success: false, message: "error on server" });
  }
};

/**
 * Change Email
 * METHOD : POST
 * URL : /api/emailChange
 * BODY : newEmail
 */
export const editEmail = async (req, res) => {
  try {
    let reqBody = req.body;
    let checkEmail = await User.findOne({
      email: reqBody.newEmail,
      _id: { $ne: req.user.id },
    });
    if (checkEmail) {
      if (checkEmail.status == 'deleted') {
        return res
          .status(400)
          .json({ success: false, errors: { newEmail: "The email is disabled for update" } });
      } else {
        return res
          .status(400)
          .json({ success: false, errors: { newEmail: "Email already exists" } });
      }
    }


    let encryptToken = encryptString(req.user.id, true);
    let usrData = await User.findOne({ _id: req.user.id });

    if (usrData.email == reqBody.newEmail) {
      return res
        .status(400)
        .json({ success: false, errors: { newEmail: "Change new email" } });
    }

    usrData.newEmail = reqBody.newEmail;
    usrData.newEmailToken = encryptToken;

    let userData = await usrData.save();

    let content = {
      confirmMailUrl: `${config.FRONT_URL}/verify-old-email/${encryptToken}`,
      date: new Date(),
    };
    mailTemplateLang({
      userId: userData._id,
      identifier: "change_register_email",
      toEmail: userData.email,
      content,
    });

    return res.status(200).json({
      success: true,
      message: "Verification link sent to your old email address.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

/**
 * Sent Verification Link to New Email
 * METHOD : PUT
 * URL : /api/emailChange
 * BODY : token
 */
export const sentVerifLink = async (req, res) => {
  try {
    let reqBody = req.body;
    let userId = decryptString(reqBody.token, true);

    let userData = await User.findById(userId);

    if (userData.newEmailToken != reqBody.token) {
      return res.status(400).json({ success: false, message: "Invalid Link" });
    }

    let encryptToken = encryptString(userData._id, true);
    userData.newEmailToken = encryptToken;
    await userData.save();

    let content = {
      confirmMailUrl: `${config.FRONT_URL}/verify-new-email/${encryptToken}`,
      date: new Date(),
    };

    mailTemplateLang({
      userId: userData._id,
      identifier: "verify_new_email",
      toEmail: userData.newEmail,
      content,
    });
    return res.status(200).json({
      success: true,
      message: "Verification link sent to your new email address.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

/**
 * Verify New Email
 * METHOD : PATCH
 * URL : /api/emailChange
 * BODY : token
 */
export const verifyNewEmail = async (req, res) => {
  try {
    let reqBody = req.body;
    let userId = decryptString(reqBody.token, true);
    let checkUser = await User.findById(userId);

    if (!checkUser) {
      return res.status(500).json({ success: false, message: "Invalid link" });
    }

    let checkEmail = await User.findOne({
      email: checkUser.newEmail,
      _id: { $ne: checkUser._id },
    });
    if (checkEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    if (checkUser.newEmailToken != reqBody.token) {
      return res.status(500).json({ success: false, message: "Invalid link" });
    }

    await User.updateOne(
      {
        _id: checkUser._id,
      },
      {
        $set: {
          email: checkUser.newEmail,
          newEmail: "",
          newEmailToken: "",
        },
      }
    );

    newNotification({
      userId: checkUser._id,
      type: "Change email address",
      description: "update email address successfully",
    });
    try {
      let respData = await axios({
        method: "post",
        url: `${config.ICOAPI}/users/updateEmail`,
        data: { oldEmail: checkUser.email, newEmail: checkUser.newEmail },
      });
    } catch (err) {
      // console.log("errrrr", err);
    }

    return res
      .status(200)
      .json({ success: true, message: "Change email address successfully" });
  } catch (err) {
    console.log("errrrr", err);
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};
// //Delete for dummy users
// async function test() {
//   return false;
//   let users = await User.find({ email: /yopmail.com/ });
//   //console.log(users.length, "vvvvv");
//   for (let i = 0; i < users.length; i++) {
//     console.log(i, users[i], "_iddddd");
//     var _id = users[i]._id;
//     // console.log(_id, "_iddddd");

//     //let users = await Assets.findOneAndRemove({ userId: _id });

//     let usersA = await Assets.remove({ userId: _id });
//     console.log(usersA, "usersA");
//     //await usersA.remove();
//     let usersb = await User.findOne({ _id: _id });
//     console.log(usersb, "usersb");
//     await usersb.remove();
//   }

//   //console.log(users, "VENNNNNN");
// }
// // End Delete

export const updateUPIDetail = async (req, res) => {
  try {
    let upiDetailsArr = [],
      reqBody = req.body;

    let message = "";
    let userData = await User.findById(req.user.id);

    if (
      !isEmpty(reqBody.upiId) &&
      mongoose.Types.ObjectId.isValid(reqBody.id)
    ) {
      let upiData = userData.upiDetails.id(reqBody.id);

      if (upiData.isPrimary == false && reqBody.isPrimary == true) {
        let isPrimaryId = userData.upiDetails.find(
          (el) => el.isPrimary == true
        );
        if (isPrimaryId) {
          let isPrimaryData = userData.upiDetails.id(isPrimaryId);
          isPrimaryData.isPrimary = false;
        }
      } else if (upiData.isPrimary == true && reqBody.isPrimary == false) {
        reqBody.isPrimary = true;
      }

      upiData.upiId = reqBody.upiId;
      upiData.isPrimary = reqBody.isPrimary;
      message = "UPI Account Edited Successfully";
    } else {
      if (userData.upiDetails && userData.upiDetails.length > 0) {
        upiDetailsArr = userData.upiDetails;

        if (reqBody.isPrimary == true) {
          let upiDetails = userData.upiDetails.find(
            (el) => el.isPrimary == true
          );
          let upiData = userData.upiDetails.id(upiDetails._id);
          upiData.isPrimary = false;
        }

        upiDetailsArr.push({
          upiId: reqBody.upiId,
          isPrimary: reqBody.isPrimary,
        });
      } else {
        upiDetailsArr.push({
          upiId: reqBody.upiId,
          isPrimary: true,
        });
      }
      userData.upiDetails = upiDetailsArr;
      message = "UPI Account Added Successfully";
    }

    let updateData = await userData.save();

    newNotification({
      description: message,
      userId: req.user.id,
      type: "General",
      category: "UPI Detail",
    });
    // await newNotification.save();
    return res
      .status(200)
      .json({ success: true, message: message, result: updateData.upiDetails });
  } catch (err) {
    console.log("errerrerrerrerrerr", err);
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

export const updateQRDetail = async (req, res) => {
  try {
    let qrDetailsArr = [],
      reqBody = req.body;

    let message = "";
    let userData = await User.findOne({ _id: req.user.id });
    if (!isEmpty(reqBody.id) && mongoose.Types.ObjectId.isValid(reqBody.id)) {
      let qrData = userData.qrDetails.id(reqBody.id);

      if (qrData.isPrimary == false && reqBody.isPrimary == true) {
        let isPrimaryId = userData.qrDetails.find((el) => el.isPrimary == true);
        if (isPrimaryId) {
          let isPrimaryData = userData.qrDetails.id(isPrimaryId);
          isPrimaryData.isPrimary = false;
        }
      } else if (qrData.isPrimary == true && reqBody.isPrimary == false) {
        reqBody.isPrimary = true;
      }

      qrData.frontImage = req.file.filename;
      qrData.isPrimary = reqBody.isPrimary;
      message = "Gpay Account Edited Successfully";
    } else {
      if (userData.qrDetails && userData.qrDetails.length > 0) {
        qrDetailsArr = userData.qrDetails;

        if (reqBody.isPrimary == true) {
          let qrDetails = userData.qrDetails.find((el) => el.isPrimary == true);
          let qrData = userData.qrDetails.id(qrDetails._id);
          qrData.isPrimary = false;
        }

        qrDetailsArr.push({
          frontImage: req.file.filename,
          isPrimary: reqBody.isPrimary,
        });
      } else {
        qrDetailsArr.push({
          frontImage: req.file.filename,
          isPrimary: true,
        });
      }
      console.log("qrDetailsArr--", qrDetailsArr);
      userData.qrDetails = qrDetailsArr;
      message = "Gpay Account Added Successfully";
    }

    let updateData = await userData.save();

    newNotification({
      description: message,
      userId: req.user.id,
      type: "General",
      category: "Gpay Detail",
    });
    // await newNotification.save();
    return res
      .status(200)
      .json({ success: true, message: message, result: updateData.qrDetails });
  } catch (err) {
    console.log("Err0r---", err);
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

export const deleteUPIDetail = async (req, res) => {
  try {
    let reqBody = req.body;
    let userData = await User.findById(req.user.id);

    let upiDataRemove = userData.upiDetails.id(reqBody.id);
    if (upiDataRemove.isPrimary) {
      return res.status(400).json({ success: false, message: "Can't delete primary account" });
    }
    if (upiDataRemove.isPrimary) {
      let upiDetails = userData.upiDetails.find(
        (el) => el._id.toString() != reqBody.id
      );
      if (upiDetails) {
        let upiData = userData.upiDetails.id(upiDetails._id);
        upiData.isPrimary = true;
      }
    }

    upiDataRemove.remove();
    let updateData = await userData.save();
    newNotification({
      description: "UPI Account Deleted",
      userId: req.user.id,
      type: "General",
      category: "UPI Detail",
    });
    // await newNotification.save();
    return res.status(200).json({
      success: true,
      message: "UPI Account Deleted",
      result: updateData.upiDetails,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

export const deleteQRDetail = async (req, res) => {
  try {
    let reqBody = req.body;
    let userData = await User.findById(req.user.id);

    let qrDataRemove = userData.qrDetails.id(reqBody.id);
    if (qrDataRemove.isPrimary) {
      return res.status(400).json({ success: false, message: "Can't delete primary account" });
    }
    if (qrDataRemove.isPrimary) {
      let qrDetails = userData.qrDetails.find(
        (el) => el._id.toString() != reqBody.id
      );
      if (qrDetails) {
        let upiData = userData.qrDetails.id(qrDetails._id);
        upiData.isPrimary = true;
      }
    }

    qrDataRemove.remove();
    let updateData = await userData.save();
    newNotification({
      description: "Gpay Account Deleted",
      userId: req.user.id,
      type: "General",
      category: "Gpay Detail",
    });
    // await newNotification.save();
    return res.status(200).json({
      success: true,
      message: "Gpay Account Deleted",
      result: updateData.qrDetails,
    });
  } catch (err) {
    console.log("errerrerrerrerrerrerr", err);
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

export const getUPIDetail = (req, res) => {
  User.findById(
    req.user.id,
    {
      upiDetails: 1,
    },
    (err, userData) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Error on server" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Success", result: userData });
    }
  );
};

export const getQRDetail = (req, res) => {
  User.findById(
    req.user.id,
    {
      qrDetails: 1,
    },
    (err, userData) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Error on server" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Success", result: userData });
    }
  );
};

export const setPrimaryUPI = async (req, res) => {
  try {
    let reqBody = req.body;

    let userData = await User.findById(req.user.id);

    let upiData = userData.upiDetails.id(reqBody.id);
    if (!upiData) {
      return res.status(400).json({ success: false, message: "NO_DATA" });
    }

    if (!upiData.isPrimary) {
      let isPrimaryId = userData.upiDetails.find((el) => el.isPrimary == true);
      if (isPrimaryId) {
        let isPrimaryData = userData.upiDetails.id(isPrimaryId);
        isPrimaryData.isPrimary = false;
      }
      upiData.isPrimary = true;
    }

    let updateData = await userData.save();

    return res.status(200).json({
      success: true,
      message: "Primary UPI Set successfully",
      result: updateData.upiDetails,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

export const setPrimaryQR = async (req, res) => {
  try {
    let reqBody = req.body;
    let userData = await User.findById(req.user.id);

    let qrData = userData.qrDetails.id(reqBody.id);
    if (!qrData) {
      return res.status(400).json({ success: false, message: "NO_DATA" });
    }

    if (!qrData.isPrimary) {
      let isPrimaryId = userData.qrDetails.find((el) => el.isPrimary == true);
      if (isPrimaryId) {
        let isPrimaryData = userData.qrDetails.id(isPrimaryId);
        isPrimaryData.isPrimary = false;
      }
      qrData.isPrimary = true;
    }

    let updateData = await userData.save();

    return res.status(200).json({
      success: true,
      message: "Primary QR Set successfully",
      result: updateData.qrDetails,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "SOMETHING_WRONG" });
  }
};

export const checkuserStatus = async (req, res) => {
  try {
    let userdetail = await User.findById(req.user.id);

    // .skip(pagination.skip)
    // .limit(pagination.limit);

    let result = {
      userdetail,
    };
    return res.status(200).json({ success: true, messages: "success", result });
  } catch (err) {
    res.status(500).json({ success: false, message: "error on server" });
  }
};

export const sentVerifLinktonewemail = async (req, res) => {
  try {
    let reqBody = req.body;
    let checkEmail = await User.findOne({
      email: reqBody.newEmail,
    });
    if (checkEmail) {
      if (checkEmail.status == 'deleted') {
        return res
          .status(400)
          .json({ success: false, errors: { newEmail: "The email is disabled for update" } });
      } else {
        return res
          .status(400)
          .json({ success: false, errors: { newEmail: "Email already exists" } });
      }
    }


    let encryptToken = encryptString(req.user.id, true);
    let usrData = await User.findOne({ _id: req.user.id });

    if (usrData.email == reqBody.newEmail) {
      return res
        .status(400)
        .json({ success: false, errors: { newEmail: "Change new email" } });
    }

    usrData.newEmail = reqBody.newEmail;
    usrData.newEmailToken = encryptToken;

    let userData = await usrData.save();

    let content = {
      confirmMailUrl: `${config.FRONT_URL}/verify-newadd-email/${encryptToken}`,
      date: new Date(),
    };
    mailTemplateLang({
      userId: userData._id,
      identifier: "add_email",
      toEmail: reqBody.newEmail,
      content,
    });

    return res.status(200).json({
      success: true,
      message: "Verification link sent to your email address.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

export const verifyNewEmailforadd = async (req, res) => {
  try {
    let reqBody = req.body;
    let userId = decryptString(reqBody.token, true);
    let checkUser = await User.findOne({ _id: userId });

    if (!checkUser) {
      return res.status(500).json({ success: false, message: "Invalid link" });
    }

    let checkEmail = await User.findOne({
      email: checkUser.newEmail,
      _id: { $ne: checkUser._id },
    });
    if (checkEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    if (checkUser.newEmailToken != reqBody.token) {
      return res.status(500).json({ success: false, message: "Invalid link" });
    }

    await User.updateOne(
      {
        _id: checkUser._id,
      },
      {
        $set: {
          email: checkUser.newEmail,
          newEmail: "",
          newEmailToken: "",
          emailStatus: "verified",
        },
      }
    );
    newNotification({
      userId: checkUser._id,
      type: "Email address update",
      description: "Email address updated successfully",
    });

    return res
      .status(200)
      .json({ success: true, message: "Email address successfully Added" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

export const getContactusList = async (req, res) => {

  let pagination = paginationQuery(req.query);
  let filter = filterSearchQuery(req.query, [
    "email",
    "firstname",
    "lastname",
    "buyorsell",
    "status",
  ]);
  let userSearch = {};
  if (req.query.search) {
    let branches = [
      { case: { $eq: ["$status", true] }, then: "Replied" },
      { case: { $ne: ["$status", true] }, then: "Pending" },
    ];
    let userColSearch = [
      { name: "$email", type: "string" },
      { name: "$firstname", type: "string" },
      { name: "$lastname", type: "string" },
      { type: "switch", branches: branches, },

    ];
    userSearch = searchQuery(userColSearch, req.query.search);
  }

  var totalCount = await Contact.countDocuments(userSearch);

  Contact.find(userSearch)
    .sort({ _id: -1 }).skip(pagination.skip).limit(pagination.limit)
    .then((contact) => {
      if (contact) {
        return res.status(200).json({ contact, count: totalCount });
      }
    });
};

export const replyContact = async (req, res) => {
  try {
    let { _id, reply } = req.body;

    let errors = {};
    if (isEmpty(reply)) errors.reply = "Reply message is required";
    if (!isEmpty(errors)) return res.status(400).json({ errors });

    let contactData = await Contact.findById(_id);

    let content = { email: contactData.email, question: contactData.message, replyMessage: reply };
    mailTemplateLang({
      identifier: "contactus_reply",
      toEmail: contactData.email,
      content,
    });
    contactData.reply = reply;
    contactData.status = true;
    await contactData.save();
    return res.status(200).json({ status: true, message: "Reply mail sent to user successfully." });
  } catch (err) {
    console.log("replyContact", err);
    return res.status(500).json({ status: false, message: "error on server" });
  }
};

export const getuserdetail = (req, res) => {
  User.findById(
    req.params.id,
    (err, userData) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Error on server" });
      }

      return res
        .status(200)
        .json({ success: true, message: "Success", result: userData });
    }
  );
};

export const sentOTP = async (req, res) => {
  try {
    let reqBody = req.body;
    let smsOtp = Math.floor(100000 + Math.random() * 900000);
    let userData = await User.findOne({ phoneNo: reqBody.phoneNo });
    if (!userData) {
      return res
        .status(400)
        .json({ status: false, errors: { phoneNo: "No user found" } });
    }
    console.log("rttttttttttttttttttttt", userData.status)
    if (userData.status == "Deactivated") {
      // console.log("rttttttttttttttttttttt",checkUser.active)
      return res.status(400).json({
        status: false,
        message:
          "Your Account Deactivated By Admin, Please Contact Support Team",
        errors: { phoneNo: "Your Account Deactivated By Admin, Please Contact Support Team" }
      });
    }

    if (userData.status == "deleted") {
      // console.log("rttttttttttttttttttttt",checkUser.active)
      return res.status(400).json({
        status: false,
        message:
          "The account has been deleted.",
        errors: { phoneNo: "The account has been deleted." }
      });
    }

    let smsContent = {
      to: userData.phoneNo,
      body: "Your " + config.SITE_NAME + " OTP Code is: " + smsOtp,
    };

    userData.otp = smsOtp;
    userData.otptime = new Date();
    await userData.save();
    console.log("zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz", smsContent);
    sentSms(smsContent);
    return res.status(200).json({
      status: true,
      message: "OTP sent successfully, It is only valid for 2 minutes",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, errors: { messages: "Error on server" } });
  }
};


export const updateUserDetails = async (req, res) => {
  let reqBody = req.body

  let userDetail = await User.findOne({ email: reqBody.email })

  let userKyc = await UserKyc.findOne({ userId: userDetail._id })
  let kycStatus = userKyc.addressProof.status == 'new' ? 0 : userKyc.addressProof.status == 'pending'
    ? 1 : userKyc.addressProof.status == 'approved' ? 2 : userKyc.addressProof.status == 'rejected' ? 3 : 0

  let userDetails = {
    profile: {
      // name: userDetail.firstName,
      mobileno: userDetail.phoneNo,
      phonenumber: userDetail.phoneNo,
      address: userDetail.address,
      Photofile: userDetail.profile
    },

    kyc: {
      idprooffrond: userKyc.idProof.frontImage ? userKyc.idProof.frontImage : '',
      idproofback: userKyc.idProof.backImage ? userKyc.idProof.backImage : '',
      addressproof: userKyc.addressProof.frontImage ? userKyc.addressProof.frontImage : "",
      idwithselfie: userKyc.idProof.selfiImage ? userKyc.idProof.selfiImage : '',
      status: kycStatus,
      kycStatus_submit: 1
    }
  }
  return res
    .status(200)
    .json({ success: true, message: "Success", result: userDetails });

};




export const exchnage_ICO_USER = async (req, res) => {
  try {
    let user = await User.find({}, { email: 1, phoneNo: 1, uniqueId: 1, referencecode: 1 })
    let result = {
      user: user,
      type: req.body.type
    }

    let respData = await axios({
      method: "post",
      url: `${config.ICOAPI}/users/userId_UPDATE`,
      data: result,
    });
    return res
      .status(200).json({ success: true, message: "Success" });
  } catch (err) {
    console.log("errerrerrerr", err);

  }

}





export const deleteAccount = async (req, res) => {
  try {
    let user = await User.findById(req.user.id,)

    var passwordStatus = bcrypt.compareSync(req.body.password, user.pwd);

    if (!passwordStatus) {
      return res.status(400).json({
        success: false,
        errors: { password: "PASSWORD_INCORRECT" },
      });
    }

    user.status = "deleted"
    await user.save()
    let deleteRecod = new DeletedAccount({
      email: user.email,
      phoneCode: user.phoneCode,
      phoneNo: user.phoneNo,
      userId: user._id,
    })
    await deleteRecod.save()
    if (user.email)
      mailTemplateLang({
        userId: user._id,
        identifier: "security_notification",
        toEmail: user.email,
      });

    return res
      .status(200).json({ success: true, message: "Account deleted Successfully" });
  } catch (err) {
    console.log("errerrerrerr", err);
    return res
      .status(500).json({ success: true, message: "Error on server" });
  }
}


export const getDeletedUserList = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let timezone = req.query.timezone
    let search = {};
    if (req.query.search) {
      let userColSearch = [
        { name: "$phoneCode", type: "string" },
        { name: "$email", type: "string" },
        { name: "$phoneNo", type: "string" },
        { name: "$createdDate", type: "date", timezone, format: "%d-%m-%Y %H:%M:%S" }
      ];
      search = searchQuery(userColSearch, req.query.search);
    }

    // if (req.query.search) {
    //   search["$expr"]["$or"].push({ $in: ["$userId", result.user] });
    // }
    var totalCount = await DeletedAccount.countDocuments(search);

    DeletedAccount.find(search, {
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

  } catch (err) {
    console.log("airderoperrr", err);
    res.status(500).json({ success: false, message: "error on server" });
  }
};


export const icoTokenToExchange = async (req, res) => {
  try {
    let { tfaCode, curreny, email, amount } = req.body
    let userData = await User.findOne({ "email": email })

    if (!userData) {
      return res.status(400).json({
        success: false,
        errors: { email: "EMAIL_NOT_FOUND" },
        message: "error on server"
      });
    }
    if (userData?.google2Fa?.secret == "") {
      return res
        .status(500)
        .json({ success: false, message: "Enable 2FA Code" });
    }
    console.log("exchangeip", tfaCode, curreny, email, amount)
    let verifyTwoFaCode = node2fa.verifyToken(
      userData.google2Fa.secret,
      tfaCode
    );
    if (!(verifyTwoFaCode && verifyTwoFaCode.delta == 0)) {
      if (verifyTwoFaCode == null)
        return res
          .status(400)
          .json({ success: false, message: "Invalid 2FA code" });
      if (verifyTwoFaCode && verifyTwoFaCode.delta == -1) {
        return res.status(400).json({
          success: false,
          message: "Expired 2FA code",
        });
      }
    }

    let asset = await Assets.findOneAndUpdate({ "userId": userData._id, "currencySymbol": curreny }, { $inc: { spotwallet: parseFloat(amount) } }, { new: true, upsert: true });
    console.log("asset", asset);
    if (asset) {

      let newTrnx = new Transaction({
        userId: userData._id,
        currencyId: asset.currency,
        actualAmount: parseFloat(amount),
        amount: parseFloat(amount),
        currencySymbol: asset.currencySymbol,
        status: "completed",
        paymentType: "coin_transfer",
        userAssetId: asset._id,
      });
      await newTrnx.save();
      let passbookData = {};
      passbookData.userId = userData._id;
      passbookData.coin = asset.currencySymbol;
      passbookData.currencyId = asset.currency;
      passbookData.tableId = newTrnx._id;
      passbookData.beforeBalance = parseFloat(asset.spotwallet) - parseFloat(amount);
      passbookData.afterBalance = asset.spotwallet;
      passbookData.amount = parseFloat(amount);
      passbookData.type = "Deposit";
      passbookData.category = "credit";
      createPassBook(passbookData);

      return res
        .status(200).json({ success: true, message: "Success" });
    } else {
      res.status(400).json({ success: false, message: "error on server" });
    }
    return res
      .status(200).json({ success: true, message: "Success" });
  } catch (err) {
    console.log("errerrerrerr", err);
    return res.status(500).json({ success: false, message: "error on server" });
  }

}