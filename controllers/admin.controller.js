// import package
import mongoose from "mongoose";
import LoginHistory from "../models/LoginHistory";
// import modal
import Admin from "../models/Admin";
import { paginationQuery, filterSearchQuery, searchQuery } from "../lib/adminHelpers";

// import cofig
import config from "../config";
import {
  User,
  UserSetting,
  UserKyc,
  Transaction,
  Notification,
  Currency,
  Assets,
  Language,
  EmailTemplate,
  Anouncement,
  SpotPair,
  SpotTrade,
  PerpetualPair,
  PerpetualOrder,
  SiteSetting,
  Cms,
  LaunchpadCms,
  FaqCategory,
  Faq,
  Staking,
  StakingOrder,
  StakingSettle,
  PriceConversion,
  SupportCategory,
  SupportTicket,
  ApiKey,
  P2PChat,
  P2PDispute,
  P2PFeedback,
  P2PLike,
  P2POrderbook,
  P2PSpotpairs,
  P2PTradeTable,
  AdminRevenue,
  Launchpad,
  launchpadOrder,
  Usertemp,
  Blogs,
  BlogCategory,
  newsletter_subscriber,
  Airdrop,
  FeesOwnToken,
  ReferralFee,
  ReferralCommission,
  Contact,
} from "../models";
// import lib
import { comparePassword, generatePassword } from "../lib/bcrypt";
const validatetfaInput = require("./../validation/frontend/tfainput");
import isEmpty from "../lib/isEmpty";
import { sentSms } from "../lib/smsGateway";
import { encryptString, decryptString } from "../lib/cryptoJS";
var node2fa = require("node-2fa");

const ObjectId = mongoose.Types.ObjectId;
import { mailTemplateLang } from "./emailTemplate.controller";
/**
 * Add New Admin
 * URL : /adminapi/admin
 * METHOD: POST
 * BODY : name, email, password ,restriction(path, isWriteAccess)
 */
export const addAdmin = async (req, res) => {
  try {
    let reqBody = req.body;
    reqBody.email = reqBody.email.toLowerCase();

    let checkUser = await Admin.findOne({ email: reqBody.email });

    if (checkUser) {
      return res
        .status(400)
        .json({ success: false, errors: { email: "Email is not exists" } });
    }

    let { passwordStatus, hash } = await generatePassword(reqBody.password);
    if (!passwordStatus) {
      return res
        .status(500)
        .json({ success: false, errors: { messages: "Error on server" } });
    }

    let newDoc = new Admin({
      name: reqBody.name,
      email: reqBody.email,
      password: hash,
      role: "admin",
      restriction: reqBody.restriction,
    });

    await newDoc.save();
    return res.status(200).json({ success: true });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

/**
 * Edit Admin
 * URL : /adminapi/admin
 * METHOD: POST
 * BODY : adminId, name, email, restriction(path, isWriteAccess)
 */
export const editAdmin = async (req, res) => {
  try {
    let reqBody = req.body;
    reqBody.email = reqBody.email.toLowerCase();

    let checkUser = await Admin.findOne({
      email: reqBody.email,
      _id: { $ne: reqBody.adminId },
    });

    if (checkUser) {
      return res
        .status(400)
        .json({ success: false, errors: { email: "Email is not exists" } });
    }

    // let { passwordStatus, hash } = await generatePassword(reqBody.password);
    // if (!passwordStatus) {
    //     return res.status(500).json({ "success": false, 'errors': { 'messages': "Error on server" } })
    // }
    let updateData = await Admin.findOneAndUpdate(
      { _id: reqBody.adminId },
      {
        $set: {
          name: reqBody.name,
          email: reqBody.email,
          restriction: reqBody.restriction,
        },
      },
      { new: true }
    );

    return res
      .status(200)
      .json({ success: true, result: { messages: "Updated successfully" } });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

/**
 * Admin List
 * URL : /adminapi/admin
 * METHOD: GET
 */
export const getAdmin = (req, res) => {
  Admin.find({}, { name: 1, email: 1 }, (err, adminData) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, errors: { messages: "Error on server" } });
    }
    return res.status(200).json({ success: true, result: adminData });
  });
};

/**
 * Get Single Admin
 * URL : /adminapi/singleAdmin
 * METHOD: GET
 */
export const getSingleAdmin = (req, res) => {
  Admin.findOne(
    { _id: req.params.id },
    { name: 1, email: 1, restriction: 1 },
    (err, adminData) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, errors: { messages: "Error on server" } });
      }
      return res.status(200).json({ success: true, result: adminData });
    }
  );
};

/**
 * Admin Login
 * URL : /adminapi/login
 * METHOD: POST
 * BODY : email, password
 */
export const adminLogin = async (req, res) => {
  try {
    let reqBody = req.body;
    reqBody.email = reqBody.email.toLowerCase();
    let isLoginHistory = !isEmpty(req.body.loginHistory);
    let checkUser = await Admin.findOne({ email: reqBody.email });
    if (!checkUser) {
      return res
        .status(404)
        .json({ success: false, errors: { email: "Email not found" } });
    }

    // if (!checkUser.role) {
    //     return res.status(400).json({ "success": false, 'errors': { 'messages': "Role is not exists" } })
    // }

    // if (checkUser.role != 'superadmin' && (!checkUser.restriction || checkUser.restriction.length < 0)) {
    //     return res.status(400).json({ "success": false, 'errors': { 'messages': "Restriction access is not exists" } })
    // }

    let { passwordStatus } = await comparePassword(
      reqBody.password,
      checkUser.password
    );
    if (!passwordStatus) {
      if (isLoginHistory) {
        loginHistory({
          ...req.body.loginHistory,
          ...{
            status: "Failed",
            reason: "Password Incorrect",
            userId: checkUser._id,
          },
        });
      }
      return res
        .status(400)
        .json({ success: false, errors: { password: "Password incorrect" } });
    }

    // if (
    //   checkUser.googlesecretcode == "" ||
    //   checkUser.googlesecretcode == undefined ||
    //   req.body.twoFACode == undefined
    // ) {
    //   return res.status(400).json({
    //     success: false,
    //     errors: { tfa: "2fa enabled please enter 2fa" },
    //   });
    // }

    if (!isEmpty(checkUser.googlesecretcode) && isEmpty(req.body.twofa_code)) {
      return res.status(200).json({
        success: true,
        twoFaStatus: "enabled",
      });
    }

    if (!isEmpty(checkUser.googlesecretcode) && !isEmpty(req.body.twofa_code)) {
      let check2Fa = node2fa.verifyToken(
        checkUser.googlesecretcode,
        reqBody.twofa_code
      );
      if (!(check2Fa && check2Fa.delta == 0)) {
        return res
          .status(400)
          .json({ success: false, errors: { twoFACode: "INVALID_CODE" } });
      }
    }

    let payloadData = {
      _id: checkUser._id,
      // "restriction": checkUser.restriction,
      role: checkUser.role,
      User: checkUser.User,
      UserBalance: checkUser.UserBalance,
      Currency: checkUser.Currency,
      PriceConversation: checkUser.PriceConversation,
      SpotPair: checkUser.SpotPair,
      SideSetting: checkUser.SideSetting,
      FaqCategory: checkUser.FaqCategory,
      Faq: checkUser.Faq,
      SupportCategory: checkUser.SupportCategory,
      Support: checkUser.Support,
      EmailTemplate: checkUser.EmailTemplate,
      CmsPage: checkUser.CmsPage,
      Kyc: checkUser.Kyc,
      WithdrawList: checkUser.WithdrawList,
      DepositList: checkUser.DepositList,
      ContactUs: checkUser.ContactUs,
      Newsletter: checkUser.Newsletter,
      Announcement: checkUser.Announcement,
      Launchpad: checkUser.Launchpad,
      LaunchpadCms: checkUser.LaunchpadCms,
      Language: checkUser.Language,
      SpotOrderHistory: checkUser.SpotOrderHistory,
      SpotTradeHistory: checkUser.SpotTradeHistory,
      TradingBot: checkUser.TradingBot,
      BlogArticle: checkUser.BlogArticle,
      BlogCategory: checkUser.BlogCategory,
      Staking: checkUser.Staking,
      p2ptradehistory: checkUser.p2ptradehistory,
      p2pchathistory: checkUser.p2pchathistory,
      p2pdisputelist: checkUser.p2pdisputelist,
      p2pcommissionhistory: checkUser.p2pcommissionhistory,
      stackingorder: checkUser.stackingorder,
      stackingsettlement: checkUser.stackingsettlement,
      airdrop: checkUser.airdrop,
      refferalcommisonhistory: checkUser.refferalcommisonhistory,
      feeandrefferal: checkUser.feeandrefferal,
      p2ppair: checkUser.p2ppair,
      airdropHistory: checkUser.airdropHistory,
      deleteuserList: checkUser.deleteuserList,
    };
    let token = new Admin().generateJWT(payloadData);

    if (isLoginHistory) {
      loginHistory({
        ...reqBody.loginHistory,
        ...{ status: "Success", reason: "success", userId: checkUser._id },
      });
    }
    return res
      .status(200)
      .json({ success: true, message: "Login successfully", token });
  } catch (err) {
    console.log(err, "rrrrrrrrrrr");
    return res.status(500).json({ success: false, message: "Error on server" });
  }
};

/**
 * Get Profile
 * URL : /adminapi/profile
 * METHOD: GET
 */
export const getProfile = async (req, res) => {
  Admin.findOne(
    { _id: req.user.id },
    {
      name: 1,
      email: 1,
      mobileno: 1,
      _id: 0,
    },
    (err, adminData) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, errors: { messages: "Error on server" } });
      }
      return res.status(200).json({
        success: true,
        message: "Login successfully",
        result: adminData,
      });
    }
  );
};

/**
 * Update Profile
 * URL : /adminapi/profile
 * METHOD: PUT
 * BODY : name
 */
export const editProfile = async (req, res) => {
  // console.log("req.user.idreq.user.idreq.user.id",req.user.id)
  let reqBody = req.body;
  Admin.findOneAndUpdate(
    { _id: req.user.id },
    { name: reqBody.name, email: reqBody.email, mobileno: reqBody.phonenumber },

    { new: true },
    (err, adminData) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, errors: { messages: "Error on server" } });
      }
      return res.status(200).json({
        success: true,
        message: "Profile Updated successfully",
        result: adminData,
      });
    }
  );
};
export const onEmailupdate = async (req, res) => {
  // console.log("req.user.idreq.user.idreq.user.id",req.user.id)
  let reqBody = req.body;
  Admin.findOne(
    {
      email: reqBody.newemail,
    },
    (err, adminDatapresend) => {
      if (err) {
        return res.status(200).json({
          success: false,
          showbutton: 0,
          message: "Email already exists",
        });
      }
      if (adminDatapresend) {
        res.status(200).json({
          success: false,
          showbutton: 0,
          message: "Email already exists",
        });
        return;
      } else {
        const otpcheck = Math.floor(100000 + Math.random() * 900000);
        Admin.findOneAndUpdate(
          { _id: req.user.id },
          { newemail: reqBody.newemail, newemailstatus: 1, oldotp: otpcheck },

          { new: true },
          (err, adminData) => {
            if (err) {
              return res
                .status(500)
                .json({
                  success: false,
                  errors: { messages: "Error on server" },
                });
            }
            let content = {
              email: adminData.email,
              otp: otpcheck,
            };
            mailTemplateLang({
              userId: adminData._id,
              identifier: "admin_current_email_verification",
              toEmail: adminData.email,
              content,
            });
            return res.status(200).json({
              success: true,
              showbutton: 1,
              message:
                "Verification mail send to your Current email successfully",
              result: adminData,
            });
          }
        );
      }
    }
  );
};

export const otpsendtonewemail = async (req, res) => {

  let reqBody = req.body;
  Admin.findOne(
    {
      _id: req.user.id,
    },
    (err, adminDatapresend) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, errors: { messages: "Error on server" } });
      }
      if (adminDatapresend) {

        if (adminDatapresend.oldotp != reqBody.oldemailotp)
          return res
            .status(200)
            .json({ success: false, showbutton: 0, message: "Invalid otp" });

        const otpcheck = Math.floor(100000 + Math.random() * 900000);
        Admin.findOneAndUpdate(
          { _id: req.user.id },
          { newemailstatus: 2, newotp: otpcheck, oldotp: "" },

          { new: true },
          (err, adminData) => {
            if (err) {
              return res
                .status(200)
                .json({
                  success: false,
                  showbutton: 0,
                  errors: { messages: "Error on server" },
                });
            }
            let content = {
              email: adminData.newemail,
              otp: otpcheck,
            };
            mailTemplateLang({
              userId: adminData._id,
              identifier: "admin_new_email_verification",
              toEmail: adminData.newemail,
              content,
            });
            return res.status(200).json({
              success: true,
              showbutton: 2,
              message: "Verification mail send to New email successfully",
              result: adminData,
            });
          }
        );
      }
    }
  );
};

export const updateadminemail = async (req, res) => {

  let reqBody = req.body;
  Admin.findOne(
    {
      _id: req.user.id,
    },
    (err, adminDatapresend) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, errors: { messages: "Error on server" } });
      }
      if (adminDatapresend) {
        if (adminDatapresend.newotp != reqBody.newemailotp)
          return res
            .status(200)
            .json({ success: false, showbutton: 0, message: "Invalid otp" });

        // const otpcheck = Math.floor(100000 + Math.random() * 900000);
        Admin.findOneAndUpdate(
          { _id: req.user.id },
          {
            newemailstatus: 0,
            newotp: "",
            email: adminDatapresend.newemail,
            newemail: "",
          },

          { new: true },
          (err, adminData) => {
            if (err) {
              return res
                .status(200)
                .json({
                  success: false,
                  showbutton: 0,
                  errors: { messages: "Error on server" },
                });
            }
            return res.status(200).json({
              success: true,
              showbutton: 0,
              message: "Email Changed Successfully",
              result: adminData,
            });
          }
        );
      }
    }
  );
};
/**
 * Forgot Password
 * URL : /adminapi/forgotPassword
 * METHOD: POST
 * BODY : email
 */
export const forgotPassword = async (req, res) => {
  let { email } = req.body;

  try {
    Admin.findOne({ email }, async (err, adminData) => {
      if (err)
        return res.status(500).json({ success: false, message: "Something went wrong, please try again later." });
      if (!adminData)
        return res.status(400).json({ success: false, errors: { email: "Email does not exists" } });

      let encryptToken = encryptString(adminData._id, true);
      let content = {
        name: adminData.firstName,
        confirmMailUrl: `${config.ADMIN_URL}/resetPassword/${encryptToken}`,
      };

      console.log("confirmMailUrl", `${config.ADMIN_URL}/resetPassword/${encryptToken}`)
      adminData.forgotPassword = encryptToken
      await adminData.save()
      mailTemplateLang({
        userId: adminData._id,
        identifier: "User_forgot",
        toEmail: adminData.email,
        content,
      });
      return res.status(200).json({ success: true, message: "Reset password link sent to your mail" });
    }
    );
  } catch (err) {
    return res.status(500).json({ success: false, message: "Confirm your mail" });
  }
};

/**
 * Reset Password
 * METHOD : POST
 * URL : /adminapi/resetPassword
 * BODY : password, confirmPassword, authToken
 */
export const resetPassword = async (req, res) => {
  try {
    let reqBody = req.body;
    let userId = decryptString(reqBody.authToken, true);

    console.log('userId', reqBody.authToken, userId);

    let { passwordStatus, hash } = await generatePassword(reqBody.password);
    if (!passwordStatus) {
      return res.status(500).json({ success: false, message: "Something went wrong, please try again later." });
    }

    let adminData = await Admin.findById(userId);
    if (!adminData) {
      return res.status(500).json({ success: false, message: "User not found" });
    }
    if (adminData.forgotPassword != reqBody.authToken) {
      return res.status(500).json({ success: false, message: "Link already used" });
    }

    adminData.password = hash;
    adminData.forgotPassword = ""
    await adminData.save();

    return res.status(200).json({ success: true, message: "Updated successfully" });
  } catch (err) {
    console.log("resetPassword", err);
    return res.status(500).json({ success: false, message: "Something went wrong, please try again later." });
  }
};

export const getUserList = async (req, res) => {
  try {
    User.find({}).then((user) => {
      if (user) {
        return res.status(200).send(user);
        console.log(user, "uesrezzzzzzz");
      }
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const userget = async (req, res) => {
  const id = req.params.id;
  Admin.findById(id).then((user) => {
    if (user) {
      var result = user.toObject();
      if (
        typeof user.googlesecretcode == "undefined" ||
        user.google == "Disabled"
      ) {
        var newSecret = node2fa.generateSecret({
          name: "MudraExchangeAdmin",
        });
        result.newSecret = newSecret;
      } else {
        // console.log("else");
        result.newSecret = {
          secret: user.googlesecretcode,
        };
      }

      return res.status(200).send(result);
    } else {
      console.log("fsdfsdfsdf");
    }
  });
};

export const tfaenable = async (req, res) => {

  const { errors, isValid } = validatetfaInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  Admin.findOne(
    {
      _id: req.body.userid,
    },
    async function (usererr, userdata) {
      console.log(userdata, "Date 132213131");

      if (userdata) {
        let { passwordStatus } = await comparePassword(
          req.body.loginpassword,
          userdata.password
        );
        if (passwordStatus) {
          if (
            typeof userdata.google == "undefined" ||
            userdata.google == "Disabled"
          ) {
            var secret_code = req.body.secretcode,
              code_app = req.body.onecode;
  
            var newSecret = await node2fa.verifyToken(secret_code, code_app);
    
            if (newSecret) {
          
              if (
                typeof newSecret.delta != "undefined" &&
                newSecret.delta != -1
              ) {
                let updatedata = {};
                updatedata["googlesecretcode"] = secret_code;
                updatedata["google"] = "Enabled";
                Admin.findOneAndUpdate(
                  {
                    _id: req.body.userid,
                  },
                  {
                    $set: updatedata,
                  },
                  {
                    new: true,
                  }
                ).exec(function (uperr, resUpdate) {
                  if (uperr) {
                    res.json({
                      status: false,
                      message: uperr,
                    });
                  }
                  if (resUpdate) {
                    res.status(200).json({
                      message: "2FA status activated successfully",
                      success: true,
                      tfastatus: "active",
                    });
                  }
                });
              }
            } else {
              return res.status(400).json({
                onecode: "Code is wrong, try with new code",
              });
            }
          } else {
            var secret_code = req.body.secretcode,
              code_app = req.body.onecode;
            var newSecret = node2fa.verifyToken(secret_code, code_app);
            if (newSecret) {
              if (
                typeof newSecret.delta != "undefined" &&
                newSecret.delta != -1
              ) {
                let updatedata = {};
                updatedata["googlesecretcode"] = "";
                updatedata["google"] = "Disabled";
                Admin.findOneAndUpdate(
                  {
                    _id: req.body.userid,
                  },
                  {
                    $set: updatedata,
                  },
                  {
                    new: true,
                  }
                ).exec(function (uperr, resUpdate) {
                  if (uperr) {
                    res.json({
                      status: false,
                      message: uperr,
                    });
                  }
                  if (resUpdate) {
                    res.status(200).json({
                      message: "2FA status deactivated successfully",
                      success: true,
                      tfastatus: "deactive",
                    });
                  }
                });
              }
            } else {
              res.status(400).json({
                onecode: "Code is wrong, try with new code",
              });
            }
          }
        } else {
          return res.status(400).json({
            loginpassword: "Login password is wrong",
          });
        }
      }
    }
  );
};

export const getcountfordashboard = async (req, res) => {
  try {
    let filter = filterSearchQuery(req.query, [
      "firstCurrency",
      "secondCurrency",
      "buyorsell",
    ]);

    filter["status"] = { $in: ["pending", "completed", "cancel"] };
    let usercount = await User.countDocuments()
    let p2pcount = await P2POrderbook.find({ status: 4 }).count();
    let spotcount = await SpotTrade.aggregate([
      { $unwind: "$filled" },
      {
        $lookup: {
          from: "users",
          localField: "filled.buyUserId",
          foreignField: "_id",
          as: "buyerinfo",
        },
      },
      { $unwind: { path: "$buyerInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "filled.sellUserId",
          foreignField: "_id",
          as: "sellerinfo",
        },
      },
      { $unwind: { path: "$sellerInfo", preserveNullAndEmptyArrays: true} },
      {
        $project: {
          firstCurrency: 1,
          secondCurrency: 1,
          buyorsell: 1,
          price: "$filled.price",
          filledQuantity: "$filled.filledQuantity",
          orderValue: "$filled.orderValue",
          Fees: "$filled.Fees",
          buyUserId: "$buyerinfo.email",
          sellUserId: "$sellerinfo.email",
          createdAt: {
            $dateToString: {
              date: "$filled.createdAt",
              format: "%Y-%m-%d %H:%M",
            },
          },
        },
      },
    ]);

    let stackingcount = await StakingOrder.find({ status: "cancel_date" })
      .populate({ path: "userId", select: "email" })
      .count();
    let supportcount = await SupportTicket.find().count();
    let depositcount = await Transaction.countDocuments({paymentType: { $in: ["coin_deposit", "fiat_deposit"] }, status: "completed",})
    
    // await Transaction.find({ $or: [{ paymentType: "coin_deposit" }, { paymentType: "fiat_deposit" }] }, { status: "completed" }).count();
    let withdrawcount = await Transaction.aggregate([
      {
        $match: {
          paymentType: { $in: ["coin_withdraw", "fiat_withdraw"] },
          status: "completed",
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
        },
      },
    ]);

    // await Transaction.find({ $or: [{ paymentType: "coin_withdraw" }, { paymentType: "fiat_withdraw" }] }, { status: "completed" }).count();
    let p2pdispute = await P2PDispute.find().count();
    let contactUs = await Contact.countDocuments();
    let kyc = await UserKyc.countDocuments({ $or: [{ "idProof.status": { $ne: "new" } }, { "addressProof.status": { $ne: "new" } }] });

    let result = {
      user: usercount,
      kyc,
      p2p: p2pcount,
      stacking: stackingcount,
      spot: spotcount.length,
      supportticket: supportcount,
      depposit: depositcount,
      withdraw: withdrawcount.length,
      p2pdispute,
      contactUs,
    };

    return res.status(200).json({ success: true, result: result });
  } catch (err) {
    console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", err);
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const sendotp = async (req, res) => {
  try {
    let reqBody = req.body;
    Admin.findOne(
      {
        mobileno: reqBody.sendotptono,
      },
      (err, adminDatapresend) => {
        if (err) {
          return res
            .status(500)
            .json({ success: false, errors: { messages: "Error on server" } });
        }
        if (adminDatapresend) {
          return res
            .status(200)
            .json({ success: false, message: "Mobile no already exists" });
        }

        const otpcheck = Math.floor(100000 + Math.random() * 900000);
        Admin.findOneAndUpdate(
          { _id: req.user.id },
          {
            newmobileno: reqBody.sendotptono,
            newmobilenostatus: 1,
            oldotp: otpcheck,
          },

          { new: true },
          (err, adminData) => {
            if (err) {
              return res
                .status(500)
                .json({
                  success: false,
                  errors: { messages: "Error on server" },
                });
            }

            let smsContent = {
              to: reqBody.sendotptono,
              body: "Your " + config.SITE_NAME + " OTP Code is: " + otpcheck,
            };
            console.log("content----", smsContent);
            console.log("otp---", otpcheck);
            var smsstate = sentSms(smsContent);

            return res.status(200).json({
              success: true,

              message: "Verification OTP send to your Mobile no successfully",
              result: adminData,
            });
          }
        );
      }
    );
  } catch (err) {
    console.log("errerrerrerrerrerrerr", err);
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const updatemobileno = async (req, res) => {
  try {
    let reqBody = req.body;
    Admin.findOne(
      {
        _id: req.user.id,
      },
      (err, adminDatapresend) => {
        if (err) {
          return res
            .status(500)
            .json({ success: false, errors: { messages: "Error on server" } });
        }

        if (adminDatapresend) {

          if (adminDatapresend.oldotp == reqBody.addmobileotp) {
            Admin.findOneAndUpdate(
              { _id: req.user.id },
              {
                mobileno: adminDatapresend.newmobileno,
                newmobilenostatus: 2,
                oldotp: "",
              },

              { new: true },
              (err, adminData) => {
                if (err) {
                  return res
                    .status(500)
                    .json({
                      success: false,
                      errors: { messages: "Error on server" },
                    });
                }

                return res.status(200).json({
                  success: true,

                  message: "Mobile No Added Successfully",
                  result: adminData,
                });
              }
            );
          } else {
            return res
              .status(200)
              .json({ success: false, message: "Invalid OTP" });
          }
        }
      }
    );
  } catch (err) {
    console.log("errerrerrerrerrerrerr", err);
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

/**
 * Get User Trade History
 * URL : /api/spot/tradeHistory/{{pairId}}
 * METHOD : GET
 * Query : page, limit
 */
export const gettradehistory_dashChart = async (req, res) => {
  try {
    let data = await SpotTrade.aggregate([
      // { $unwind: "$filled" },
      {
        $match: {
          // userId: ObjectId(req.user.id),
          status: {
            $in: ["pending", "completed", "cancel"],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $unwind: "$filled" },

      {
        $group: {
          _id: {
            userId: "$userId",
            secondCurrency: "$secondCurrency",
          },
          // price: "$filled.price",
          price: { $sum: "$filled.price" },
        },

        // count: { $sum: 1 } }
      },
    ]).allowDiskUse(true);


    var arrData = [];

    for (var i = 0; i < data.length; i++) {
      let UserId = data[i]._id.userId.toString();
      let secondCurr = data[i]._id.secondCurrency;

      
      let price = data[i].price;

      let PriceCNV = await PriceConversion.findOne({
        baseSymbol: secondCurr,
        convertSymbol: "INR",
      }).lean();
      let usdtprice=0;
      if (PriceCNV) {
         usdtprice = price * PriceCNV.convertPrice;
      } else {
        if(secondCurr=="INR"){
           usdtprice = price*1;
        }else{
           usdtprice = 0;
        }
        
      }

      var userDet = await User.findById(UserId);

      if(userDet){
        let checkIndex = arrData.findIndex(
          (el) => el.userId.toString() == UserId
        );
     
        if (checkIndex >= 0) {
          arrData[checkIndex]["price"] = arrData[checkIndex]["price"] + usdtprice;
        } else {
          arrData.push({
            userId: userDet.email == null ? userDet.phoneNo : userDet.email,
            price: usdtprice,
          });
        }
      }

    }
    // var set =  arrData.sort({""});

    var Toptrader = arrData.sort(
      (teamA, teamB) =>
        teamB.price - teamA.price || teamA.userId.localeCompare(teamB.userId)
    );

    var Toptrader = Toptrader.slice(0, 5);


    return res.status(200).json({ success: true, result: Toptrader, arrData });
  } catch (err) {
    console.log("checkerr", err);
    return res.status(500).json({ success: false });
  }
};

export const getTopTradeHistory = async (req, res) => {
  try {
    // let pagination = paginationQuery(req.query);
    // let filter = filterSearchQuery(req.query, [
    //   "firstCurrency",
    //   "secondCurrency",
    //   "buyorsell",
    // ]);

    // filter["status"] = { $in: ["pending", "completed", "cancel"] };
    // filter["status"] = { $in: ["completed", ] };

    let count = await SpotTrade.aggregate([
      {
        $match: {
          status: {
            $in: ["pending", "completed", "cancel"],
          },
        },
      },
      {
        $group: {
          _id: {
            secondCurrencyId: "$secondCurrencyId",
            userId: "$userId",
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // console.log(count, "countcountcountcount")
    //     {

    //   // {
    //   //   $group: {
    //   //     _id: {
    //   //       buyUserId: "$filled.buyUserId",
    //   //       sellUserId: "$filled.sellUserId",
    //   //       sellOrderId: "$filled.sellOrderId",
    //   //       buyOrderId: "$filled.buyOrderId",
    //   //     },
    //   //     createdAt: { $first: "$filled.createdAt" },
    //   //     Type: { $first: "$filled.Type" },
    //   //     price: { $first: "$filled.price" },
    //   //     filledQuantity: { $first: "$filled.filledQuantity" },
    //   //   },
    //   // },
    //     // { $match: filter },
    //     { $unwind: "$filled" },
    //     { $sort: { createdAt: -1 } },
    //     {
    //       "$lookup": {
    //           "from": 'users',
    //           "localField": "filled.buyUserId",
    //           "foreignField": "_id",
    //           "as": "buyerinfo"
    //       }
    //   },
    //   { "$unwind": "$buyerinfo" },
    //   {
    //     "$lookup": {
    //         "from": 'users',
    //         "localField": "filled.sellUserId",
    //         "foreignField": "_id",
    //         "as": "sellerinfo"
    //     }
    // },
    // { "$unwind": "$sellerinfo" },
    //     {
    //       $project: {
    //         firstCurrency: 1,
    //         secondCurrency: 1,
    //         buyorsell: 1,
    //         price: "$filled.price",
    //         filledQuantity: "$filled.filledQuantity",
    //         orderValue: "$filled.orderValue",
    //         Fees: "$filled.Fees",
    //         buyUserId:"$buyerinfo.email",
    //       sellUserId:"$sellerinfo.email",
    //         createdAt: {
    //           $dateToString: {
    //             date: "$filled.createdAt",
    //             format: "%Y-%m-%d %H:%M",
    //           },
    //         },
    //       },
    //     },

    // ]);

    let data = await SpotTrade.aggregate([
      {
        $match: {
          // userId: ObjectId(req.user.id),
          status: {
            $in: ["pending", "completed", "cancel"],
          },
        },
      },
      { $unwind: "$filled" },

      {
        $group: {
          _id: {
            secondCurrencyId: "$secondCurrencyId",
            userId: "$userId",
          },
          count: { $sum: 1 },
          //  price: {$sum :"$filled.price" },
        },
      },
      // { $match: filter },
      // { $sort: { createdAt: -1 } },
      // {
      //   "$lookup": {
      //     "from": 'users',
      //     "localField": "filled.buyUserId",
      //     "foreignField": "_id",
      //     "as": "buyerinfo"
      //   }
      // },
      // { "$unwind": "$buyerinfo" },
      // {
      //   "$lookup": {
      //     "from": 'users',
      //     "localField": "filled.sellUserId",
      //     "foreignField": "_id",
      //     "as": "sellerinfo"
      //   }
      // },
      // { "$unwind": "$sellerinfo" },
      // {
      //   $project: {
      //     firstCurrency: 1,
      //     secondCurrency: 1,
      //     buyorsell: 1,
      //     price: "$filled.price",
      //     filledQuantity: "$filled.filledQuantity",
      //     orderValue: "$filled.orderValue",
      //     Fees: "$filled.Fees",
      //     buyUserId: "$buyerinfo.email",
      //     sellUserId: "$sellerinfo.email",
      //     createdAt: {
      //       $dateToString: {
      //         date: "$filled.createdAt",
      //         format: "%Y-%m-%d %H:%M",
      //       },
      //     },
      //   },
      // },
      // { $skip: pagination.skip },
      // { $limit: pagination.limit },
    ]);

    //     var arrData = []
    //    let data1 = 0;
    //     for (var i = 0; i < data.length; i++) {
    //         let name = data[i].buyUserId;
    //         let price = data[i].price;
    // var price1 = price +  data[i].price;
    //         console.log('dd',name,price1)
    // arrData.push({
    //     value: name,
    //     label: price,
    // })

    // }
    // console.log("valuevalue", arrData);
    let result = {
      count: count.length,
      data,
    };

    // console.log('result',result)

    return res.status(200).json({ success: true, messages: "success", result });
  } catch (err) {
    console.log("err", err);
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};

export const LoginhistoryPag = async (req, res) => {
  try {
    let pagination = paginationQuery(req.query);
    let filter = filterSearchQuery(req.query, [
      "countryName",
      "regionName",
      "broswername",
      "status",
    ]);

    let findadmin = await Admin.find({ _id: ObjectId(req.user.id) });

    if (findadmin[0].role == "superadmin") {
      let count = await LoginHistory.countDocuments(filter);
      let data = await LoginHistory.find(filter, {
        _id: 0,
        countryCode: 1,
        countryName: 1,
        regionName: 1,
        ipaddress: 1,
        broswername: 1,
        ismobile: 1,
        os: 1,
        status: 1,
        reason: 1,
        createdDate: 1,

        // "loginhistory": 1,
        _id: 0,
      })
        .sort({ createdDate: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit);

      let result = {
        count,
        data,
        //  imageUrl: `${config.SERVER_URL}${config.IMAGE.CURRENCY_URL_PATH}`
      };
      return res
        .status(200)
        .json({ success: true, message: "FETCH_SUCCESS", result });
    } else {
      filter.userId = ObjectId(req.user.id);
  

      let count = await LoginHistory.countDocuments(filter);
      let data = await LoginHistory.find(filter, {
        _id: 0,
        countryCode: 1,
        countryName: 1,
        regionName: 1,
        ipaddress: 1,
        broswername: 1,
        ismobile: 1,
        os: 1,
        status: 1,
        reason: 1,
        createdDate: 1,

        // "loginhistory": 1,
        _id: 0,
      })
        .sort({ createdDate: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit);
      let result = {
        count,
        data,
        //  imageUrl: `${config.SERVER_URL}${config.IMAGE.CURRENCY_URL_PATH}`
      };
      return res
        .status(200)
        .json({ success: true, message: "FETCH_SUCCESS", result });
    }
  } catch (err) {
    return res.status(500).json({ success: true, message: "SOMETHING_WRONG" });
  }
};
export const getLoginHistory = async (req, res) => {
  try {

    let { timezone, filter, sortOrder, offset, limit, download } = req.body;

    let sortBy = {};
    sortBy[sortOrder.column] = sortOrder.order == "asc" ? 1 : -1;
    limit = parseInt(limit);

    let { role } = await Admin.findById(req.user.id).lean();

    let search = {};
    if (role != "superadmin")
      search.userId = ObjectId(req.user.id);
    if (filter) {
      let searchColumns = [
        { name: "$countryCode", type: "string" },
        { name: "$countryName", type: "string" },
        { name: "$regionName", type: "string" },
        { name: "$broswername", type: "string" },
        { name: "$ipaddress", type: "string" },
        { name: "$os", type: "string" },
        { name: "$ismobile", type: "string" },
        {
          name: "$createdDate",
          type: "date",
          timezone,
          format: "%d-%m-%Y %H:%M:%S",
        },
        { name: "$status", type: "string" },
        { name: "$reason", type: "string" }
      ];
      search = searchQuery(searchColumns, filter);
    }

    if (!download)
      var totalCount = await LoginHistory.countDocuments(search);

    await LoginHistory.find(search).sort(sortBy).skip(offset).limit(limit).exec((err, history) => {
      if (err) {
        return res.status(400).json({ status: false, message: "Error occured" });
      } else {
        return res.status(200).json({ status: true, result: history, totalCount });
      }
    });
  } catch (err) {
    console.log("getLoginHistory", err);
    return res.status(500).json({ success: true, message: "SOMETHING_WRONG" });
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
    region,
    broswername,
    ismobile,
    os,
    status,
    reason,
    userId,
    createdDate: new Date(),
  };


  const Data = new LoginHistory({
    countryName: countryName,
    countryCode: countryCode,
    ipaddress: ipaddress,
    regionName: region, // regionName
    broswername: broswername,
    ismobile: ismobile,
    os: os,
    status: status,
    reason: reason,
    userId: userId,
  });
  const saveData = Data.save();
  //     Admin.update({ '_id': userId }, {
  //         '$push': {
  //             'loginhistory': data,
  //         },
  //     }, (err, data) => {
  //         console.log(data, '-------------->>>>>>>>>>>>>')
  //         console.log(err, '-------------->>>>>')
  //     })
};



export const changePassword = async (req, res) => {
  try {
    let reqBody = req.body;
    let userId = req.user.id;

    let adminData = await Admin.findOne({ _id: userId });
    if (!adminData) {
      return res
        .status(500)
        .json({ success: false, errors: { messages: "User not found" } });
    }
    // console.log("adminDataadminDataadminData",adminData)
    var { passwordStatus } = await comparePassword(
      reqBody.oldPassword,
      adminData.password
    );
    // console.log("adminDataadminDataadminData",comparepasswordStatus)

    if (!passwordStatus) {
      return res.status(400).json({
        success: false,
        errors: { oldPassword: "Incorrect Old Password" },
      });
    }
    var { passwordStatus, hash } = await generatePassword(reqBody.password);
    if (!passwordStatus) {
      return res
        .status(500)
        .json({ success: false, errors: { messages: "Error on server" } });
    }

    adminData.password = hash;
    await adminData.save();

    return res
      .status(200)
      .json({ success: true, messages: "Updated successfully" });
  } catch (err) {
    console.log("errerrerrerr", err);
    return res
      .status(500)
      .json({ success: false, errors: { messages: "Error on server" } });
  }
};