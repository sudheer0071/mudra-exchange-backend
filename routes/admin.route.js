//  import packages
import express from "express";
import passport from "passport";

// import controllers
import * as adminCtrl from "../controllers/admin.controller";
import * as languageCtrl from "../controllers/language.controller";
import * as emailTemplateCtrl from "../controllers/emailTemplate.controller";
import * as userKycCtrl from "../controllers/userKyc.controller";
import * as currencyCtrl from "../controllers/currency.controller";
import * as walletCtrl from "../controllers/wallet.controller";
import * as stakingCtrl from "../controllers/staking.controller";
import * as siteSettingCtrl from "../controllers/siteSetting.controller";
import * as cmsCtrl from "../controllers/cms.controller";
import * as siteMapCtrl from "../controllers/siteMap.controller";
import * as faqCtrl from "../controllers/faq.controller";
import * as commonCtrl from "../controllers/common.controller";
import * as pairCtrl from "../controllers/pairManage.controller";
import * as userCntrl from "../controllers/user.controller";
import * as reportCtrl from "../controllers/report.controller";
import * as supportCtrl from "../controllers/support.controller";
import * as priceCNVCtrl from "../controllers/priceCNV.controller";
import * as anouncementCtrl from "../controllers/anouncement.controller";
import * as notifiCntrl from '../controllers/notification.controller'
import * as launchpadCtrl from "../controllers/launchpad.controller";
import * as lanchpadcmsCtrl from "../controllers/launchpadcms.controller";
import * as tradeBotCtrl from '../controllers/tradeBot.controller';
import * as passbookCtrl from '../controllers/passbook.controller';
// import validation
import * as adminValid from "../validation/admin.validation";
import * as languageValid from "../validation/language.validation";
import * as currencyValid from "../validation/currency.validation";
import * as emailTemplateValid from "../validation/emailTemplate.validation";
import * as userKycValid from "../validation/userKyc.validation";
import * as walletValid from "../validation/wallet.validation";
import * as stakingValid from "../validation/staking.validation";
import * as pairValidate from "../validation/pair.validation";
import * as siteSettingsValid from "../validation/siteSettings.validation";
import * as priceCNVValid from "../validation/priceCNV.validation";
import * as anouncementValid from "../validation/anouncement.validation";

import * as airdropCtrl from "../controllers/airdrop.controller";
import * as tradeBotValid from '../validation/tradeBot.validation';
import * as launchpadValid from "../validation/launchpad.validation";
import * as cmsValid from "../validation/cms";

const router = express();
const passportAuth = passport.authenticate("adminAuth", { session: false });

// Admin
router.route("/login").post(adminValid.loginValidate, adminCtrl.adminLogin);
router
  .route("/forgotPassword")
  .post(adminValid.forgotPwdValidation, adminCtrl.forgotPassword);
router
  .route("/resetPassword")
  .post(adminValid.resetPasswordValidation, adminCtrl.resetPassword);
router
  .route("/changePassword")
  .post(passportAuth, adminValid.resetPwdValidate, adminCtrl.changePassword);
// Currency
router
  .route("/currency")
  .get(passportAuth, currencyCtrl.currencyList)
  .post(
    passportAuth,
    currencyCtrl.uploadCurrency,
    currencyValid.addCurrencyValidate,
    currencyCtrl.addCurrency
  )
  .put(
    passportAuth,
    currencyCtrl.uploadCurrency,
    currencyValid.editCurrencyValidate,
    currencyCtrl.updateCurrency
  );
router.route("/getCurrency").get(passportAuth, currencyCtrl.getCurrency);
router.route("/currencyselect").get(passportAuth, currencyCtrl.currencySelect);

router.route("/adminAdd").post(passportAuth, currencyCtrl.addAdmin);
router.route("/adminUpdate").post(passportAuth, currencyCtrl.updateAdmin);
router.route("/deleteAdmin").post(passportAuth, currencyCtrl.deleteAdmin);
router.route("/alladmindetails").get(passportAuth, currencyCtrl.adminDetails);

// Language
router
  .route("/language")
  .get(passportAuth, languageCtrl.languageList)
  .post(passportAuth, languageValid.addLangValidate, languageCtrl.addLanguage)
  .put(passportAuth, languageValid.editLangValidate, languageCtrl.editLanguage);
//router.route('/getLanguage').get(passportAuth, languageCtrl.getLanguage);

// Email Template
router
  .route("/emailTemplate")
  .get(passportAuth, emailTemplateCtrl.emailTemplateList)
  .post(
    passportAuth,
    emailTemplateValid.addTemplateValidate,
    emailTemplateCtrl.addEmailTemplate
  )
  .put(
    passportAuth,
    emailTemplateValid.editTemplateValidate,
    emailTemplateCtrl.editEmailTemplate
  );

//anouncement
router
  .route("/anouncement")
  .put(
    passportAuth,
    anouncementValid.anouncementAdd,
    anouncementCtrl.anouncementAdd
  ).post(passportAuth, anouncementCtrl.getAnnouncementHistory);

// User
router.route("/user").get(passportAuth, userCntrl.getUserList);
router.route("/changeStatus").post(passportAuth, userCntrl.changeStatus);
router.route("/change2Fa").post(passportAuth, userCntrl.changeTwofa);
router.route("/getUserListforairdrop").get(passportAuth, userCntrl.getUserListforairdrop);

router.route("/getUserBalnce").get(passportAuth, userCntrl.getUserBalanceList);
router.route("/getSingleUserAssetDetails").get(passportAuth, userCntrl.getSingleUserAssetDetails);

router
  .route("/userKyc")
  .get(passportAuth, userKycCtrl.getAllUserKyc)
  .post(passportAuth, userKycCtrl.approveUserKyc)
  .put(passportAuth, userKycValid.rejectKycValidate, userKycCtrl.rejectUserKyc);
router
  .route("/getUserKychistory")
  .get(passportAuth, userKycCtrl.getUserKychistory)
router
  .route("/changeUsrType/:userId")
  .put(passportAuth, userKycCtrl.changeUserType);

// Wallet
// router.route('/depositList').get(passportAuth, walletCtrl.getDepositList)
router.route("/depositList").post(passportAuth, reportCtrl.fundTransferHistory);
router.route("/withdrawList").get(passportAuth, walletCtrl.getWithdrawList);
//  router.route('/withdrawList').get(passportAuth, reportCtrl.getWithdrawList)

router.route("/refferrallist").get(passportAuth, reportCtrl.getreferrallist);

router
  .route("/coinWithdraw/approve/:transactionId")
  .get(passportAuth, walletCtrl.coinWithdrawApprove);
router
  .route("/coinWithdraw/reject/:transactionId/:message")
  .get(passportAuth, walletCtrl.coinWithdrawReject);
router
  .route("/fiatWithdraw/approve/:transactionId")
  .get(passportAuth, walletCtrl.fiatWithdrawApprove);
router
  .route("/fiatWithdraw/reject/:transactionId/:message")
  .get(passportAuth, walletCtrl.fiatWithdrawReject);
router
  .route("/fiatDeposit/approve")
  .post(
    passportAuth,
    walletValid.fiatDepositApproveValid,
    walletCtrl.fiatDepositApprove
  );
router
  .route("/fiatDeposit/reject")
  .post(
    passportAuth,
    walletValid.fiatDepositRejectValid,
    walletCtrl.fiatDepositReject
  );


// Staking
router
  .route("/staking")
  .get(passportAuth, stakingCtrl.stakingList)
  .post(passportAuth, stakingValid.addStakeValid, stakingCtrl.addStaking)
  .put(passportAuth, stakingValid.editStakeValid, stakingCtrl.editStaking);

// Site Setting
router
  .route("/getSiteSetting")
  .get(passportAuth, siteSettingCtrl.getSiteSetting);
router
  .route("/updateSiteSetting")
  .put(passportAuth, siteSettingCtrl.updateSiteSetting);
router
  .route("/updateSiteDetails")
  .put(
    passportAuth,
    siteSettingCtrl.uploadSiteDetails,
    siteSettingsValid.siteSettingsValid,
    siteSettingCtrl.updateSiteDetails
  );
router.route("/updateUsrDash").put(passportAuth, siteSettingCtrl.updateUsrDash);

// CMS
router
  .route("/cms/:stage")
  .get(passportAuth, cmsCtrl.getCmsList)
router
  .route("/cms")
  .get(passportAuth, cmsCtrl.getCmsList)
  .put(passportAuth, cmsCtrl.updateCms);
router
  .route("/sliderUpdate")
  .post(passportAuth, cmsValid.LaunchpadUpload, cmsValid.sliderValidate, cmsCtrl.sliderUpdate)
  .put(passportAuth, cmsCtrl.cms_statusChnage);
// FAQ
router
  .route("/faqCategory")
  .get(passportAuth, faqCtrl.listFaqCategory)
  .post(passportAuth, faqCtrl.addFaqCategory)
  .put(passportAuth, faqCtrl.updateFaqCategory)
  .delete(passportAuth, faqCtrl.deleteFaqCategory);

router.route("/getFaqCategory").get(passportAuth, faqCtrl.getFaqCategory);
router
  .route("/faq")
  .get(passportAuth, faqCtrl.listFaq)
  .post(passportAuth, adminValid.faqValidation, faqCtrl.addFaq)
  .put(passportAuth, adminValid.faqValidation, faqCtrl.updateFaq)
  .delete(passportAuth, faqCtrl.deleteFaq);

//spotTrade Pair
router
  .route("/spotPair")
  .get(passportAuth, pairCtrl.spotPairList)
  .post(passportAuth, pairValidate.addSpotPairValid, pairCtrl.addSpotPair)
  .put(passportAuth, pairValidate.editSpotPairValid, pairCtrl.editSpotPair);

// P2p
router.route("/chat-data").get(passportAuth, reportCtrl.GetChatData);
router.route("/chat-data").post(passportAuth, reportCtrl.p2pchatdispute);
router.route("/p2pdisputelist").post(passportAuth, reportCtrl.p2pdisputelist);
router.route("/p2pTradeView/:orderId").get(passportAuth, reportCtrl.p2pOrder);
router.route("/p2pchat/:orderId").get(passportAuth, reportCtrl.p2pchatHistory);
router.route("/p2presolveBuyer").post(passportAuth, reportCtrl.p2presolveBuyer);
router
  .route("/p2presolveSeller")
  .post(passportAuth, reportCtrl.p2presolveSeller);
router
  .route("/saveChatDetails")
  .post(passportAuth, reportCtrl.uploadChatImage, reportCtrl.saveChatDetails);

//P2PTrade Pair
router
  .route("/p2pPair")
  .get(passportAuth, pairCtrl.p2pPairList)
  .post(passportAuth, pairValidate.addP2PPairValid, pairCtrl.addP2PPair)
  .put(passportAuth, pairValidate.editP2PPairValid, pairCtrl.editP2PPair);

router.route("/p2pTrade").get(passportAuth, reportCtrl.p2porderHistory);
// .post(passportAuth, languageValid.addLangValidate, languageCtrl.addLanguage)
// .put(passportAuth, languageValid.editLangValidate, languageCtrl.editLanguage);
router.route("/adminrevenue").get(passportAuth, reportCtrl.adminRevenue);

router.route("/pair-data-first").get(passportAuth, reportCtrl.pair_data_first);

// spot History
router
  .route("/spotOrderHistory")
  .post(passportAuth, reportCtrl.spotorderHistory);
router
  .route("/spotTradeHistory")
  .post(passportAuth, reportCtrl.spotTradeHistory);


router
  .route("/userPassBookHistory")
  .get(passportAuth, passbookCtrl.userPassbookHistory);
// /userPassBookHistory/:uniqueId
//Price Conversion
router
  .route("/priceCNV")
  .get(passportAuth, priceCNVCtrl.getPriceCNVlist)
  .put(
    passportAuth,
    priceCNVValid.priceCNVUpdateValid,
    priceCNVCtrl.priceCNVUpdate
  );


//SiteMap 
router
  .route("/siteMap")
  .get(passportAuth, siteMapCtrl.getSitemap)
  .post(passportAuth, siteMapCtrl.addSitemap)
  .put(passportAuth, siteMapCtrl.editSitemap);
router.route("/siteUrldelete").post(siteMapCtrl.deleteSiteUrl);
// Support
router
  .route("/supportCategory")
  .get(passportAuth, supportCtrl.getSupportCategory)
  .post(passportAuth, supportCtrl.addSupportCategory)
  .put(passportAuth, supportCtrl.editSupportCategory);

router.route("/ticketList").get(passportAuth, supportCtrl.getTicketList);
router
  .route("/ticketMessage")
  .get(passportAuth, supportCtrl.getTicketMessage)
  .put(passportAuth, supportCtrl.replyMessage)
  .delete(passportAuth, supportCtrl.adminCloseTicket);

// Common
router.route("/getPairDropdown").get(passportAuth, commonCtrl.getPairDropdown);

//edit profile
router
  .route("/profileupload")
  .post(
    passportAuth,
    adminValid.updateUserValidationant,
    adminCtrl.editProfile
  );
router.route("/getadmindetail").get(passportAuth, adminCtrl.getProfile);
router
  .route("/onEmailupdate")
  .post(passportAuth, adminValid.validateemail, adminCtrl.onEmailupdate);
router
  .route("/otpsendtonewemail")
  .post(passportAuth, adminCtrl.otpsendtonewemail);
router
  .route("/updateadminemail")
  .post(passportAuth, adminCtrl.updateadminemail);
//LaunchpadCms
router.route("/get-launchpadcms").get(lanchpadcmsCtrl.getLaunchpadCmsList);
router.route("/getAppLaunchpadList").get(lanchpadcmsCtrl.getAppLaunchpadList);

router
  .route("/updateLaunchpadCms")
  .put(lanchpadcmsCtrl.LaunchpadUpload, lanchpadcmsCtrl.updateLaunchpadCms);
// Launchpad
router.route("/get-launchpad").get(launchpadCtrl.getLaunchpad);
router
  .route("/add-launchpad")
  .post(
    launchpadCtrl.LaunchpadUpload,
    launchpadValid.createLaunchpadValid,
    launchpadCtrl.createLaunchpad
  );
router
  .route("/update-launchpad")
  .post(
    launchpadCtrl.LaunchpadUpload,
    launchpadValid.createLaunchpadValid,
    launchpadCtrl.updateLaunchpad
  );
router
  .route("/rejectLaunchpad")
  .post(passportAuth,
    launchpadCtrl.rejectLaunchpad
  );
router.route("/launchpad-change-status").post(launchpadCtrl.changeStatus);
router.route("/delete-launchpad").post(launchpadCtrl.deleteLaunchpad);

router
  .route("/airdrop")
  .get(passportAuth, airdropCtrl.getairdropList)
  .post(passportAuth, airdropCtrl.airdropadd);

router.route("/stakingorderHistory").get(stakingCtrl.orderHistory);
router.route("/stakingsettlementHistory").get(stakingCtrl.settlementHistory);

router
  .route("/feesowntoken")
  .get(passportAuth, airdropCtrl.getownfees)

  .post(passportAuth, airdropCtrl.addfeesowntoken);

router
  .route("/savereferral")
  .get(passportAuth, airdropCtrl.getrefrralfees)

  .post(passportAuth, airdropCtrl.savereferral);

router.route("/userget/:id").get(passportAuth, adminCtrl.userget);

router.route("/tfaenable").post(passportAuth, adminCtrl.tfaenable);



router.route("/getcountfordashboard").get(adminCtrl.getcountfordashboard);
router.route("/sendotp").post(passportAuth, adminCtrl.sendotp);
router.route("/updatemobileno").post(passportAuth, adminCtrl.updatemobileno);



router.route('/contactus').post(passportAuth, userCntrl.getContactusList)
router.route('/replycontact').post(userCntrl.replyContact)

router
  .route("/currencyFees")
  .get(currencyCtrl.currencyListFees)
router
  .route("/p2pPairFees")
  .get(pairCtrl.p2pPairListFees)
router
  .route("/spotPairFees")
  .get(pairCtrl.spotPairListFees)

// Trading Bot
router.route('/newBot').post(passportAuth, tradeBotValid.newBot, tradeBotCtrl.newBot)
router.route('/botList').get(passportAuth, tradeBotCtrl.botList)
router.route('/removeBot/:id').get(passportAuth, tradeBotCtrl.removeBot)
router.route('/botUser').get(passportAuth, tradeBotCtrl.getBotUser).post(passportAuth, tradeBotCtrl.newBotUser)
router.route('/bot-order-cancel/:botId').get(passportAuth, tradeBotCtrl.botAllOpenOrderCancel)
router
  .route("/gettradehistory_dash")
  .get(adminCtrl.gettradehistory_dashChart);

// router.route("/getTopTradeHistory").get(adminCtrl.getTopTradeHistory);


//Notification History
router.route('/getNotification').get(passportAuth, notifiCntrl.getAdminNotification)
  .post(passportAuth, notifiCntrl.clearNotify)

//admin login
router.route('/login-history').get(passportAuth, adminCtrl.LoginhistoryPag);
router.route("/loginHistory").post(passportAuth, adminCtrl.getLoginHistory);

// bulkdeposit
router.route("/bulkDeposit").post(passportAuth, walletCtrl.bulkDeposit);
router.route("/downloadWithdrawListCsvFile").get(passportAuth, walletCtrl.downloadWithdrawListCsvFile);
router.route("/bulkWithhdraw").post(passportAuth, walletCtrl.bulkWithhdraw);

//deleteduserList
router.route("/getDeletedUserList").get(passportAuth, userCntrl.getDeletedUserList);

export default router;

