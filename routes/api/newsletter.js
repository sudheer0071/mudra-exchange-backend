const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const sendmail = require("./bsendmail.js");

import { SiteSetting, User } from "../../models";

// import config
import config from "../../config";

router.get("/test", (req, res) => {
    res.json({ statue: "success" });
});

router.get("/news-letter", (req, res) => {
    User.find({ email: { $ne: null } }).then((user) => {
        if (user) {
            return res.status(200).send(user);
  
        }
    });
});

router.post("/sendnewsletter", async function (req, res) {
    var pdata = req.body;
    let errors = {};
    if (!pdata.email.length) {
        errors.email = "Email is required";
    }

    if (!pdata.message.trim()) {
        errors.message = "Message is required";
    }

    if (Object.keys(errors).length)
        return res.status(400).json({ success: false, errors: errors });

    // check DB
    try {
        var emaildata = {};
        var assign_email = [];
        let siteSettingsData = await SiteSetting.findOne({});

       
        if(pdata.email[0]=="All"){
            let allEmail = await User.find({},{email:1,_id:0});
            allEmail.forEach(function (fetitem) {
            console.log("allEmailallEmail",fetitem);
                assign_email.push(fetitem.email);
                /*********** send mail ***********/
                var toemail = fetitem.email;
                var sitename = siteSettingsData.siteName;
                var datetime = new Date();
                var date = `${datetime.getFullYear()}/${(datetime.getMonth() + 1)}/${datetime.getDate()}`;
                emaildata["identifier"] = "News_Letter";
                emaildata["replace_cnt"] = {
                    "##MESSAGE##": pdata.message,
                    "##SITE_URL##": config.FRONT_URL,
                    "##EMAIL_LOGO##": siteSettingsData.emailLogoUrl,
                    "##SUPPORT_MAIL##": siteSettingsData.supportMail,
                    "##TWITER_LINK##": siteSettingsData.twitterUrl,
                    "##LINKEDIN_LINK##": siteSettingsData.linkedinLink,
                    "##FB_LINK##": siteSettingsData.facebookLink,
                    "##SITE_NAME##": siteSettingsData.siteName,
                    "##CONTACT_NO##": siteSettingsData.contactNo,
                    "##ADDRESS##": siteSettingsData.address,
                    "##TWITER_LOGO##": config.SERVER_URL + "/emailimages/twiter.png",
                    "##FB_LOGO##": config.SERVER_URL + "/emailimages/facbook.png",
                    "##LINKED_IN_LOGO##": config.SERVER_URL + "/emailimages/telegaram.png",
                };
                var strreplace_cnd = /##MESSAGE##|##SITE_URL##|##EMAIL_LOGO##|##SUPPORT_MAIL##|##TWITER_LINK##|##LINKEDIN_LINK##|##FB_LINK##|##SITE_NAME##|##CONTACT_NO##|##CONTACT_NO##|##ADDRESS##|##TWITER_LOGO##|##FB_LOGO##|##LINKED_IN_LOGO##/gi;
                emaildata["strrp_cond"] = strreplace_cnd;
                emaildata["to"] = toemail;
    
                var sent_mail = new sendmail.get(emaildata, res);
                // Create and save object
                /*********** send mail ***********/
            });
        }else{
            pdata.email.forEach(function (fetitem) {
            
                /*********** send mail ***********/
                var toemail = fetitem;
                var sitename = siteSettingsData.siteName;
                var datetime = new Date();
                var date = `${datetime.getFullYear()}/${(datetime.getMonth() + 1)}/${datetime.getDate()}`;
                emaildata["identifier"] = "News_Letter";
                emaildata["replace_cnt"] = {
                    "##MESSAGE##": pdata.message,
                    "##SITE_URL##": config.FRONT_URL,
                    "##EMAIL_LOGO##": siteSettingsData.emailLogoUrl,
                    "##SUPPORT_MAIL##": siteSettingsData.supportMail,
                    "##TWITER_LINK##": siteSettingsData.twitterUrl,
                    "##LINKEDIN_LINK##": siteSettingsData.linkedinLink,
                    "##FB_LINK##": siteSettingsData.facebookLink,
                    "##SITE_NAME##": siteSettingsData.siteName,
                    "##CONTACT_NO##": siteSettingsData.contactNo,
                    "##ADDRESS##": siteSettingsData.address,
                    "##TWITER_LOGO##": config.SERVER_URL + "/emailimages/twiter.png",
                    "##FB_LOGO##": config.SERVER_URL + "/emailimages/facbook.png",
                    "##LINKED_IN_LOGO##": config.SERVER_URL + "/emailimages/telegaram.png",
                };
                var strreplace_cnd = /##MESSAGE##|##SITE_URL##|##EMAIL_LOGO##|##SUPPORT_MAIL##|##TWITER_LINK##|##LINKEDIN_LINK##|##FB_LINK##|##SITE_NAME##|##CONTACT_NO##|##CONTACT_NO##|##ADDRESS##|##TWITER_LOGO##|##FB_LOGO##|##LINKED_IN_LOGO##/gi;
                emaildata["strrp_cond"] = strreplace_cnd;
                emaildata["to"] = toemail;
    
                var sent_mail = new sendmail.get(emaildata, res);
                // Create and save object
                /*********** send mail ***********/
            });
        }
      

        res.status(200).json({status:true, message:"Sent newsletter mails sucessfully. Refreshing data..."});
    } catch (err) {
        console.log(err);
        res.status(400).json({ status: false, message: err.message });
    }
});

module.exports = router;