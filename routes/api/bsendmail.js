const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
import { EmailTemplate } from "../../models";
import config from "../../config";

var get = function (req, res) {
  
  var strreplace_cnd = req.strrp_cond;
  var mapObj = req.replace_cnt;
  var identifier = req.identifier;
  var toemail = req.to;

  EmailTemplate.findOne({ identifier }, {_id:0}, function(err,bcdata) {

    var msgcnt = bcdata.content.replace(strreplace_cnd, function (matched) {
      return mapObj[matched];
    });
    var subcnt = bcdata.subject.replace(strreplace_cnd, function (matched) {
      return mapObj[matched];
    });

    let transporter = nodemailer.createTransport(
      config.emailGateway.nodemailer
      );

    var mailOptions = {
      from: config.emailGateway.fromMail,
      to: toemail,
      subject: subcnt,
      html: msgcnt,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        //   res.json({"status":false , "message":" message not sent.try again later."});
      } else {
        //console.log(info,'info');
      }
    });
  });
};

module.exports = router;
module.exports.get = get;