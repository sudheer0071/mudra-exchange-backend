//  import packages
import express from "express";
import passport from "passport";
import Sitemap from "../models/sitemap";
import config from '../config/index';

const js2xmlparser = require("js2xmlparser");
// import controllers
import * as userCtrl from "../controllers/user.controller";
import * as currencyCtrl from "../controllers/currency.controller";
import * as languageCtrl from "../controllers/language.controller";
import * as userKycCtrl from "../controllers/userKyc.controller";
import * as assetsCtrl from "../controllers/assets.controller";
import * as walletCtrl from "../controllers/wallet.controller";
import * as dashboardCtrl from "../controllers/dashboard.controller";
import * as spotTradeCtrl from "../controllers/spotTrade.controller";
// import * as derivativeTradeCtrl from "../controllers/derivativeTrade.controller";
import * as chartCtrl from "../controllers/chart/chart.controller";
import * as apiKeyCtrl from "../controllers/apiManage.controller";
import * as airdropCtrl from "../controllers/airdrop.controller";

import * as wazirxCtrl from "../controllers/wazirx.controller";

import * as commonCtrl from "../controllers/common.controller";
import * as cmsCtrl from "../controllers/cms.controller";
import * as faqCtrl from "../controllers/faq.controller";
import * as stakingCtrl from "../controllers/staking.controller";
import * as anouncementCtrl from "../controllers/anouncement.controller";
import * as supportCtrl from "../controllers/support.controller";
import * as webhookCtrl from "../controllers/webhook.controller";
import * as priceCNVCtrl from "../controllers/priceCNV.controller";

import * as p2pCtrl from "../controllers/p2p.controller";

import * as launchpadCtrl from "../controllers/launchpad.controller";
import * as lanchpadcmsCtrl from "../controllers/launchpadcms.controller";
import * as ZaakCtrl from "../controllers/zaakpay.controller";
import * as blogController from "../controllers/blog.controller";
import * as referralcommissionCtrl from "../controllers/referralcommission.controller";
import * as icoCtrl from "../controllers/ico.controller";

//coin gateway
import * as bnbGateway from  "../controllers/coin/bnbGateway";

// import validation
import * as userValid from "../validation/user.validation";
import * as userKycValid from "../validation/userKyc.validation";
import * as walletValid from "../validation/wallet.validation";
import * as spotTradeValid from "../validation/spotTrade.validation";

import * as p2pTradeValid from "../validation/p2pTrade.validation";
import * as launchpadValid from "../validation/launchpad.validation";

import * as blogValidation from "../validation/blog.validation";
import * as supportValid from "../validation/support.validation";
import * as apiKeyVaild from '../validation/apiKey.validation'

const router = express();
const passportAuth = passport.authenticate("usersAuth", { session: false });

const multer = require("multer");
const path = require("path");
const fs = require("fs");

var storage1 = multer.diskStorage({
  destination: "./public/images/blogImages",
  filename: function (req, file, cb) {
    cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
  },
});

var uploads = multer({
  storage: storage1,
}).fields([
  { name: "file", maxCount: 1 },
  { name: "file_pro", maxCount: 1 },
  { name: "authorImage", maxCount: 1 },

]);

var storage = multer.diskStorage({
  destination: "./public/images/chat/",
  filename: function (req, file, cb) {
    //    cb(null, file.fieldname + path.extname(file.originalname));
    cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
  },
});

var upload = multer({
  storage: storage,
});

var storageqr = multer.diskStorage({
  destination: "./public/images/qr/",
  filename: function (req, file, cb) {
    console.log("Inside multer");
    //    cb(null, file.fieldname + path.extname(file.originalname));
    cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
  },
});

var uploadQrcode = multer({
  storage: storageqr,
});
var storageprofile = multer.diskStorage({
  destination: "./public/profile/",
  filename: function (req, file, cb) {
    console.log("Inside multer");
    //    cb(null, file.fieldname + path.extname(file.originalname));
    cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
  },
});

var uploadprofile = multer({
  storage: storageprofile,
});

//ICO Platform Register
router.post("/icoregisterform", userCtrl.CreateICOuser);
router.post("/LogoutAll", passportAuth, userCtrl.LogoutFromAll);

router.route("/pricesocket").post(userCtrl.PriceUpdate);

router.route("/mergetheusers").get(userCtrl.MergeUser);

// User
router
  .route("/register")
  .post(userValid.registerValidate, userCtrl.createNewUser);
router.route("/login").post(userValid.loginValidate, userCtrl.userLogin);
router.route("/resendOtp").post(userValid.loginValidate, userCtrl.resendOtp);
// router.route("/updateNewCurrecny").get( passportAuth,assetsCtrl.updateNewCurrecny);


router.route("/icologincheck").post(userCtrl.ICOlogin);
router
  .route("/confirm-mail")
  .post(userValid.confirmMailValidate, userCtrl.confirmMail);
router
  .route("/userProfile")
  .get(passportAuth, userCtrl.getUserProfile)
  // .put(passportAuth, userValid.editProfileValidate, userCtrl.editUserProfile);
  .put(passportAuth, uploadprofile.single('profileImage'), userCtrl.editUserProfilewithimage);

router
  .route("/changePassword")
  .post(passportAuth, userValid.changePwdValidate, userCtrl.changePassword);
router.route("/upgradeUser").post(passportAuth, userCtrl.upgradeUser);
router
  .route("/security/2fa")
  .get(passportAuth, userCtrl.get2faCode)
  .put(passportAuth, userValid.update2faValid, userCtrl.update2faCode)
  .patch(passportAuth, userValid.update2faValid, userCtrl.diabled2faCode);
router
  .route("/bankdetail")
  .post(passportAuth, userValid.editBankValidate, userCtrl.updateBankDetail)
  .put(passportAuth, userValid.deleteBankValidate, userCtrl.deleteBankDetail)
  .patch(passportAuth, userValid.deleteBankValidate, userCtrl.setPrimaryBank)
  .get(passportAuth, userCtrl.getBankDetail);
router
  .route("/userSetting")
  .get(passportAuth, userCtrl.getUserSetting)
  .put(passportAuth, userValid.editSettingValid, userCtrl.editUserSetting);
router
  .route("/editNotif")
  .put(passportAuth, userValid.editNotifValid, userCtrl.editNotif);
router
  .route("/forgotPassword")
  .post(userValid.checkForgotPwdValidate, userCtrl.checkForgotPassword);
router.route("/resetPasswordexpiry").post(userCtrl.resetPasswordexpiry);
router
  .route("/resetPassword")
  .post(userValid.resetPwdValidate, userCtrl.resetPassword);
router
  .route("/phoneChange")
  .post(passportAuth, userValid.newPhoneValidate, userCtrl.changeNewPhone)
  .put(passportAuth, userValid.editPhoneValidate, userCtrl.verifyNewPhone);
router
  .route("/emailChange")
  .post(passportAuth, userValid.editEmailValidate, userCtrl.editEmail)
  .put(userValid.tokenValidate, userCtrl.sentVerifLink)
  .patch(userValid.tokenValidate, userCtrl.verifyNewEmail);

// kyc
router.route("/kycdetail").get(passportAuth, userKycCtrl.getUserKycDetail);
router
  .route("/kyc/idproof")
  .put(
    passportAuth,
    userKycCtrl.IDKycUpload,
    userKycValid.idProofValidate,
    userKycCtrl.updateIdProof
  );
router
  .route("/kyc/addressproof")
  .put(
    passportAuth,
    userKycCtrl.uploadKyc,
    userKycValid.addressProofValidate,
    userKycCtrl.updateAddressProof
  );

// assets
router
  .route("/getAssetsDetails")
  .get(passportAuth, assetsCtrl.getAssetsDetails);
router
  .route("/getAsset/:currencyId")
  .get(passportAuth, assetsCtrl.getAssetByCurrency);

// wallet
router
  .route("/fiatWithdraw")
  .post(
    passportAuth,
    walletValid.fiatWithdrawValidate,
    walletCtrl.checkUserKyc,
    walletCtrl.withdrawFiatRequest
  )
  .patch(walletValid.tokenValidate, walletCtrl.fiatRequestVerify);
router
  .route("/coinWithdraw")
  .post(
    passportAuth,
    walletValid.coinWithdrawValidate,
    walletCtrl.withdrawCoinRequest
  )
  .patch(walletValid.tokenValidate, walletCtrl.coinRequestVerify);
router
  .route("/fiatDeposit")
  .post(
    passportAuth,
    walletCtrl.uploadWalletDoc,
    walletValid.depositReqtValid,
    walletCtrl.checkUserKyc,
    walletCtrl.depositRequest
  );
router
  .route("/walletTransfer")
  .post(
    passportAuth,
    walletValid.walletTransferValid,
    walletCtrl.walletTransfer
  );
router
  .route("/history/transaction/:paymentType")
  .get(passportAuth, walletCtrl.getTrnxHistory);

// Dashboard
router
  .route("/recentTransaction")
  .get(passportAuth, dashboardCtrl.getRecentTransaction);
router.route("/loginHistory").get(passportAuth, dashboardCtrl.getLoginHistory);
router
  .route("/notificationHistory")
  .get(passportAuth, dashboardCtrl.getNotificationHistory);
router.route("/getDashBal").get(passportAuth, dashboardCtrl.getDashBal);

router
  .route("/notificationHistoryall")
  .get(passportAuth, dashboardCtrl.getNotificationHistoryAll);

router
  .route("/notificationHistory_read")
  .get(passportAuth, dashboardCtrl.getNotificationHistory_read);

router
  .route("/gettradehistory_dash")
  .get(passportAuth, dashboardCtrl.gettradehistory_dash);

router
  .route("/getorderhistory_dash")
  .get(passportAuth, dashboardCtrl.getorderhistory_dash);

// Spot Trade
router.route("/spot/tradePair").get(spotTradeCtrl.getPairList);
router
  .route("/spot/orderPlace")
  .post(
    passportAuth,
    spotTradeValid.decryptValidate,
    spotTradeCtrl.decryptTradeOrder,
    spotTradeValid.orderPlaceValidate,
    spotTradeCtrl.orderPlace
  );

router.route("/spot/ordeBook/:pairId").get(spotTradeCtrl.getOrderBook);
router
  .route("/spot/openOrder/:pairId")
  .get(passportAuth, spotTradeCtrl.getOpenOrder);
router
  .route("/spot/filledOrder/:pairId")
  .get(passportAuth, spotTradeCtrl.getFilledOrder);
router
  .route("/spot/orderHistory/:pairId")
  .get(passportAuth, spotTradeCtrl.getOrderHistory);
router
  .route("/spot/tradeHistory/:pairId")
  .get(passportAuth, spotTradeCtrl.getTradeHistory);
router.route("/spot/marketPrice/:pairId").get(spotTradeCtrl.getMarketPrice);
router.route("/spot/recentTrade/:pairId").get(spotTradeCtrl.getRecentTrade);
router
  .route("/spot/cancelOrder/:orderId")
  .delete(passportAuth, spotTradeCtrl.cancelOrder);

// chart
router.route("/chart/:config").get(chartCtrl.getChartData);

// Staking
router.route("/getStaking").get(stakingCtrl.getStaking);
router.route("/stake/balance").get(passportAuth, stakingCtrl.getStakeBal);
router.route("/stake/orderPlace").post(passportAuth, stakingCtrl.orderPlace);
router
  .route("/stake/orderPlaceLocked")
  .post(passportAuth, stakingCtrl.orderPlaceLocked);

router.route("/stake/orderList").get(passportAuth, stakingCtrl.orderList);
router
  .route("/stake/settleHistory")
  .get(passportAuth, stakingCtrl.getSettleHistory);
router
  .route("/stake/cancel/:stakeId")
  .delete(passportAuth, stakingCtrl.cancelOrder);

// API Management
router.route('/key/manage/:keyId?')
  .get(passportAuth, apiKeyCtrl.keyList)
  .post(passportAuth, apiKeyVaild.newKeyVaild, apiKeyCtrl.newKey)
  .patch(passportAuth, apiKeyCtrl.changeStatus)
  .delete(passportAuth, apiKeyCtrl.removeKey)

// Common
router.route("/getLanguage").get(languageCtrl.getLanguage);
router.route("/siteSetting").get(languageCtrl.getsiteSetting);
router.route("/getCurrency").get(currencyCtrl.getCurrency);
router.route("/getMarketTrend").get(commonCtrl.getMarketTrend);
router.route("/getPairData").get(passportAuth, commonCtrl.getPairData);
router.route("/priceConversion").get(commonCtrl.getPriceCNV);
router.route("/addPriceConverStion").post(priceCNVCtrl.addPriceConverStion);

// Announcement
router
  .route("/announcement")
  .get(passportAuth, anouncementCtrl.getAnnouncement);

// CMS
router.route("/cms/:identifier").get(cmsCtrl.getCMSPage);
router.route("/cms").get(cmsCtrl.getCMSPageHome);

// FAQ
router.route("/faq").get(faqCtrl.getFaqWithCategory);
// router.route("/faq").get(passportAuth, faqCtrl.getFaqWithCategory);

// Support Ticket
router.route("/getSptCat").get(passportAuth, supportCtrl.getSptCat);

// router
//   .route("/ticket")
//   .get(passportAuth, supportCtrl.userTicketList)
//   .post(passportAuth, supportCtrl.createNewTicket)
//   // .put(passportAuth, supportCtrl.usrReplyMsg)
//   .put(passportAuth, supportCtrl.supportUpload, supportValid.usrReplyMsg, supportCtrl.usrReplyMsg)
//   .patch(passportAuth, supportCtrl.closeTicket);

router
  .route("/ticket")
  .get(passportAuth, supportCtrl.userTicketList)
  .post(
    passportAuth,
    supportCtrl.supportUpload,
    supportValid.createNewTicket,
    supportCtrl.createNewTicket
  )
  .put(
    passportAuth,
    // supportCtrl.supportUpload,
    supportCtrl.supportimg,
    supportValid.usrReplyMsg,
    supportCtrl.usrReplyMsg
  )
  .patch(passportAuth, supportCtrl.closeTicket);

// Webhook
router.route("/depositwebhook").post(webhookCtrl.verifySign, webhookCtrl.depositwebhook);
router.route("/check2FA").get(passportAuth, userCtrl.check2FA);
// P2P Trade
router.route("/p2pTradePair").get(passportAuth, p2pCtrl.p2pTradePair);
router.route("/p2pSpotPair").get(passportAuth, p2pCtrl.p2pSpotPair);
router.route("/postTrade").post(passportAuth, p2pCtrl.p2pPostTrade);
router.route("/p2pMyadddetails").post(passportAuth, p2pCtrl.p2pMyadddetails);
router.route("/p2pMyrecentadddetails").post(passportAuth, p2pCtrl.p2pMyrecentadddetails);
router
  .route("/updateTrade")
  .post(
    passportAuth,
    p2pTradeValid.p2pOrderUpdateValidate,
    p2pCtrl.p2pUpdateTrade
  );
router.route("/getBuyAdDetails").post(passportAuth, p2pCtrl.getBuyAdDetails);
router.route("/getSellAdDetails").post(passportAuth, p2pCtrl.getSellAdDetails);
router.route("/getSarchBuyData").post(passportAuth, p2pCtrl.getSarchBuyDetails);
router
  .route("/getSarchSellData")
  .post(passportAuth, p2pCtrl.getSarchSellDetails);
router.route("/buyP2PTrade").post(passportAuth, p2pCtrl.buyP2PTrade);
router.route("/buyConfirmP2PTrade").post(passportAuth, p2pCtrl.buyConfirmP2PTrade);
router.route("/getSingleBuyAdDetails").post(passportAuth, p2pCtrl.getSingleBuyAdDetails);
router.route("/getSingleOrderDetails").post(passportAuth, p2pCtrl.getSingleOrderDetails);
router.route("/getOrderStatus").post(passportAuth, p2pCtrl.getOrderStatus);
router.route("/getChatDetails").post(passportAuth, p2pCtrl.getChatDetails);
router
  .route("/saveChatDetails")
  .post(upload.single("proofImage"), passportAuth, p2pCtrl.saveChatDetails);
router.route("/confirmPay").post(passportAuth, p2pCtrl.confirmPay);
router.route("/releaseCryptocurrency").post(passportAuth, p2pCtrl.releaseCryptocurrency);
router.route("/cancelTrade").post(passportAuth, p2pCtrl.cancelTrade);
router.route("/disputeTrade").post(passportAuth, p2pCtrl.disputeTrade);
router.route("/getTradeDetails").post(passportAuth, p2pCtrl.getTradeDetails);
router.route("/getChatlisthistory").post(passportAuth, p2pCtrl.getChatlisthistory);
router.route("/cancelMyad").post(passportAuth, p2pCtrl.cancelMyad);
router.route("/getMyTransactions").post(passportAuth, p2pCtrl.getMyTransactions);
router
  .route("/getTransactionhistory")
  .post(passportAuth, p2pCtrl.getMyTransactions);
router.route("/getMyP2PHistory").post(passportAuth, p2pCtrl.getMyP2PHistory);
router.route("/updatevacation").post(passportAuth, p2pCtrl.updatevacation);

// Launchpad
router
  .route("/get-launchpad")
  .get(passportAuth, launchpadCtrl.getLaunchpadList);
router
  .route("/get-launchpadcms")
  .get(lanchpadcmsCtrl.getLaunchpadCmsList);
router
  .route("/get-single-launchpad/:launchpadId")
  .get(passportAuth, launchpadCtrl.getSingleLaunchpad);
router
  .route("/create-launchpad-order")
  .post(
    passportAuth,
    launchpadValid.createLaunchpadOrderValid,
    launchpadCtrl.createLaunchpadOrder
  );
//new Launchapd request
router.route("/newLauncPadRequest").post(passportAuth, launchpadCtrl.LaunchpadUpload,launchpadValid.newTOEKNREQUESTvalidation,launchpadCtrl.newLauncPadRequest);
router
  .route("/get-launchpad-orders/:launchpadId")
  .get(passportAuth, launchpadCtrl.getLaunchpadHistory);

router
  .route("/history/launchpadhistory")
  .get(passportAuth, launchpadCtrl.getuserlaunchhistory);

// ZaakPay
router.route("/zaakpay/getchecksum").post(ZaakCtrl.GetCalculateSum);
router.route("/zaakpay/zaakpayconfirmed").post(ZaakCtrl.paymentDone);
router
  .route("/zaakpay/saveinitialtrans")
  .post(passportAuth, ZaakCtrl.InitialSave);

//Blog Routesss

router.route("/getallblogmain").post(blogController.landingPage_getBlogAll);
router.route("/getCategory").get(blogController.getCategory);
router.route("/saveCategory").post(blogController.saveCategory);
router.route("/getBlogCategoryList").get(blogController.getBlogCategoryList);
router
  .route("/categoryAdd")
  .post(blogValidation.categoryAdd, blogController.categoryAdd);
router
  .route("/getBlogCategoryEditData")
  .post(blogController.getBlogCategoryEditData);
router
  .route("/categoryEdit")
  .post(blogValidation.categoryAdd, blogController.categoryEdit);
router.route("/categoryDelete").post(blogController.categoryDelete);

router.route("/getBlog_recent").post(blogController.getBlog_recent);

router.route("/user-data").post(blogController.userData);
router.route("/user-changestatus").post(blogController.userChangeStatus);
router.route("/user-delete").post(blogController.userDelete);
router.route("/user-deactivate").post(blogController.userDeactivate);

router.route("/getBlogList").get(blogController.getBloglist);
router.route("/blogAdd").post(
  //uploads.single("image"),
  uploads,
  blogValidation.blogAdd,
  blogController.blogAdd
);
router.route("/blogEdit").post(uploads,blogValidation.blogAdd, blogController.blogEdit);
router.route("/getBlogEditData").post(blogController.blogEditData);
router.route("/getBlogAll").post(blogController.getBlogAll);
router.route("/changeTrendingPost").post(blogController.changeTrendingPost);
router.route("/blogDelete").post(blogController.blogDelete);

router.route("/getBlogBySlug").post(blogController.landingPage_getBlogBySlug);
router.route("/getBlogBySlugDesc").post(blogController.landingPage_getBlogBySlug1)
router
  .route("/getTrendingPost")
  .get(blogController.landingPage_getTrendingPost);

router
  .route("/updateSiteSetting")
  .post(passportAuth, blogController.updateSiteSetting);
router
  .route("/getPairDropdown")
  .get(passportAuth, blogController.getPairDropdown);

//deposit Call
router.route("/get-user-deposit").get(passportAuth, walletCtrl.getuserDeposit);

router
  .route("/addSubscription")
  .post(blogValidation.newsletteradd, blogController.addSubscription);

router
  .route("/tinyimgupload")
  .post(supportCtrl.tinymceUpload, commonCtrl.tinyimgupload);

router.route("/orderHistory").get(stakingCtrl.orderHistory);
router.route("/settlementHistory").get(stakingCtrl.settlementHistory);
router.route("/spot/feesowntoken").get(spotTradeCtrl.getownfees);


router
  .route("/upidetail")
  .post(passportAuth, userCtrl.updateUPIDetail)
  .put(passportAuth, userCtrl.deleteUPIDetail)
  .get(passportAuth, userCtrl.getUPIDetail);
router
  .route("/primaryupi")
  .post(passportAuth, userValid.deleteUPIValidate, userCtrl.setPrimaryUPI);

router
  .route("/qrdetail")
  .post(passportAuth, uploadQrcode.single("qrImage"), userCtrl.updateQRDetail)
  .put(passportAuth, userCtrl.deleteQRDetail)
  .get(passportAuth, userCtrl.getQRDetail);
router.route("/primaryqr").post(passportAuth, userCtrl.setPrimaryQR);

router.route('/checkuserStatus').get(passportAuth, userCtrl.checkuserStatus);


router.route('/refferDetail').get(passportAuth, referralcommissionCtrl.refferDetail);
router.route('/listrefferDetail').get(passportAuth, referralcommissionCtrl.refferDetaillist);

router.route("/getuserinfo").get(passportAuth, p2pCtrl.getuserinfo);



router
  .route("/addnewemail")
  .post(passportAuth, userValid.editEmailValidate, userCtrl.sentVerifLinktonewemail)
  .put(userValid.tokenValidate, userCtrl.verifyNewEmailforadd)

router.route('/addContactus').post(commonCtrl.addContactus)
router.route('/getuserId/:id').get(passportAuth, userCtrl.getuserdetail);


router
  .route("/history/airdrop/:id")
  .get(passportAuth, airdropCtrl.MygetairdropList)

router.route('/sent-otp').post(userValid.sentOptValidation, userCtrl.sentOTP);

//update ico profile and kyc
router.route('/updateUserDetails').post(userCtrl.updateUserDetails);
// assets
router
  .route("/getAssetForICO")
  .post(icoCtrl.getAssetForICO);
router.route("/buyFromMudraWallet").post(icoCtrl.buyFromMudraWallet);

router.route('/exchnage_ICO').post(userCtrl.exchnage_ICO_USER);

// coin withdraw token transfer to exchnage from ICO
router.route('/icoTokenToExchange').post(userCtrl.icoTokenToExchange);


//deleteAccojunt
router.route('/deleteAccount').post(passportAuth,userValid.deleteAccount,userCtrl.deleteAccount);

//bnb server
router.route('/wallet/bnb-deposit-info').get(assetsCtrl.getWalletAddress);
router.route("/wallet/bnb-deposit-webhook").post(bnbGateway.DepositWebhook);

router.get("/sitemap.xml", async function (req, res, next) {
  try {

    const records = await Sitemap.find({});
    // console.log('records',records)
    const collection = [];

    for (let i = 0; i < records.length; i++) {
      const url = {};
      // url.loc = "https://mudra.wealwin.com/";
      url.loc = records[i].url;
      url.priority = '1.00';
      url.changefreq = 'daily';
      collection.push(url);
    }
    console.log('url', collection)
    const col = {
      "@": {
        xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9",
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "xsi:schemaLocation": "http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd",
      },
      url: collection,
    };
    const xml = js2xmlparser.parse("urlset", col);
    console.log(xml, 'xml')
    res.set("Content-Type", "text/xml");
    res.status(200);
    res.send(xml);
  } catch (e) {
    next(e);
  }
});

export default router;
