const express = require("express");
const router = express.Router();
const async = require("async");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const request = require("request");
const { ObjectId } = require("mongodb");

const keys = require("../../config/keys");
const RippleAPI = require("ripple-lib").RippleAPI;
const CryptoJS = require("crypto-js");
const Tx = require("ethereumjs-tx").Transaction;

const Emailtemplates = require("../../models/emailtemplate");
const currency = require("../../models/currency");
const validateRegisterInput = require("../../validation/register");
const validatePatternInput = require("../../validation/pattern");
const validateLoginInput = require("../../validation/login");
const Admincontrol = require("../../models/Admincontrol");
const Assets = require("../../models/Assets");
import Admin_Revenue from "../../models/AdminRevenue";

const client = require("twilio")(
  keys.TWILIO_ACCOUT_SID,
  keys.TWILIO_AUTH_TOKEN
);
const Web3 = require("web3");
const moment = require("moment");
const web3 = new Web3(keys.infura);
const getJSON = require("get-json");

const api = new RippleAPI({
  server: keys.ripplehost, // Public rippled server
});

router.get("/test", (req, res) => {
  res.json({
    statue: "success",
  });
});

router.get("/asset-data-first", (req, res) => {
  currency.find({}).then((user) => {
    if (user) {
      return res.status(200).send(user);
      console.log(user, "uesrezzzzzzz");
    }
  });
});

router.post("/getlivebalance", (req, res) => {
  var currency = req.body.currency;
  var header = { "Content-Type": "application/json" };
  var args = { type: "getbalance" };
  // console.log(currency);
  if (currency == "BTC" || currency == "LTC" || currency == "BCH") {
    var url =
      currency == "BTC"
        ? "http://136.244.107.56:3000/btcnode"
        : currency == "LTC"
        ? "http://136.244.105.184:3000/ltcnode"
        : currency == "BCH"
        ? "http://165.227.84.53:3003/bchnode"
        : "";
    const options = {
      url: url,
      method: "POST",
      headers: header,
      body: JSON.stringify(args),
    };
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        const info = JSON.parse(body);
        res.json({ status: true, result: info.result });
      } else {
        res.json({ status: false, message: error });
      }
    });
  } else if (currency == "XRP") {
    var rippleaddress = keys.rippleaddress;
    api
      .connect()
      .then(() => {
        return api.getAccountInfo(rippleaddress).then((infodetails) => {
          if (infodetails) {
            res.json({ status: true, result: infodetails.xrpBalance });
          } else {
            res.json({ status: false, message: "error" });
          }
        });
      })
      .catch();
  } else if (currency == "ETH") {
    var ethaddress = keys.ethaddress;
    var header = { "Content-Type": "application/json" };
    var args = { ethaddress: ethaddress, type: "getbalance" };
    const options = {
      url: "http://78.141.220.37:3000/ethnode",
      method: "POST",
      headers: header,
      body: JSON.stringify(args),
    };
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        const balance = JSON.parse(body);
        res.json({ status: true, result: balance.result });
      }
    });
  }
});

router.get("/getadminassetdetails", (req, res) => {
  console.log("fsdjfksdhfkshdfkhsdf");
  Assets.find({}).then((assetdetails) => {
    var index = assetdetails.findIndex((x) => x.currencySymbol === "XRP");
    assetdetails[index].currencyAddress = keys.rippleaddress;
    res.json({
      status: "success",
      data: assetdetails,
    });
  });
});

router.post("/checkotp", (req, res) => {
  var otp = req.body.otpnumber;
  Admincontrol.findOne(
    {
      otptime: {
        $gt: new Date(new Date().getTime() - 120000),
      },
      otp: otp,
    },
    function (err, userdet) {
      if (userdet) {
        var currency = req.body.first_currency;
        var withdrawamount = req.body.withdrawamount;
        var toaddress = req.body.toaddress;
        var tagid = req.body.tagid;
        var header = { "Content-Type": "application/json" };
        console.log(withdrawamount, "withdrawamount");
        if (currency == "BTC" || currency == "LTC" || currency == "BCH") {
          var args = {
            type: "sendtoaddress",
            amount: withdrawamount,
            toaddress: toaddress,
          };
          console.log(args);
          var url =
            currency == "BTC"
              ? "http://157.230.0.110:3003"
              : currency == "LTC"
              ? "http://136.244.105.184:3000/ltcnode"
              : currency == "BCH"
              ? "http://165.227.84.53:3003/bchnode"
              : "";
          const options = {
            url: url,
            method: "POST",
            headers: header,
            body: JSON.stringify(args),
          };
          request(options, function (error, response, body) {
            console.log(error);
            if (!error && response.statusCode == 200) {
              const info = JSON.parse(body);
              console.log(info);
              if (info.result) {
                res.json({
                  status: true,
                  message:
                    "Amount Withdraw successfully transaction id is " +
                    info.result,
                });
                var jsonfilter = { identifier: "Admin_withdraw" };
                Emailtemplates.findOne(
                  jsonfilter,
                  { _id: 0 },
                  function (err, templates) {
                    if (templates.content) {
                      templateData = templates;
                      templateData.content = templateData.content.replace(
                        /##templateInfo_name##/g,
                        useremail
                      );
                      templateData.content = templateData.content.replace(
                        /##templateInfo_appName##/g,
                        keys.siteName
                      );
                      templateData.content = templateData.content.replace(
                        /##DATE##/g,
                        new Date()
                      );
                      templateData.content = templateData.content.replace(
                        /##AMOUNT##/g,
                        parseFloat(withdrawamount).toFixed(8)
                      );
                      templateData.content = templateData.content.replace(
                        /##TXID##/g,
                        info.result
                      );
                      templateData.content = templateData.content.replace(
                        /##CURRENCY##/g,
                        currency
                      );
                      var smtpConfig = {
                        host: keys.host, // Amazon email SMTP hostname
                        auth: {
                          user: keys.email,
                          pass: keys.password,
                        },
                      };
                      var transporter = nodemailer.createTransport(smtpConfig);

                      var mailOptions = {
                        from: keys.fromName + "<" + keys.fromemail + ">", // sender address
                        to: userdet.email, // list of receivers
                        subject: templateData.subject, // Subject line
                        html: templateData.content, // html body
                      };
                      transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                          return console.log(error);
                        }
                      });
                    }
                  }
                );
              } else {
                res.json({ status: false, message: info.error.message });
              }
            } else {
              res.json({ status: false, message: error.error.message });
            }
          });
        } else if (currency == "XRP") {
          var rippleaddress = keys.rippleaddress;
          // var ripplesecret = keys.ripplesecret;
          var ripplesecret = CryptoJS.AES.decrypt(
            keys.ripplesecret,
            keys.rippleSecretKey
          ).toString(CryptoJS.enc.Utf8);

          api
            .connect()
            .then(() => {
              return api.getAccountInfo(rippleaddress).then((infodetails) => {
                if (infodetails.xrpBalance >= withdrawamount) {
                  const payment = {
                    source: {
                      address: rippleaddress,
                      maxAmount: {
                        value: withdrawamount.toString(),
                        currency: "XRP",
                      },
                    },
                    destination: {
                      address: toaddress,
                      tag: tagid,
                      amount: {
                        value: withdrawamount.toString(),
                        currency: "XRP",
                      },
                    },
                  };
                  const instructions = { maxLedgerVersionOffset: 5 };
                  api.connect().then(() => {
                    // console.log('Connected...');
                    return api
                      .preparePayment(rippleaddress, payment, instructions)
                      .then((prepared) => {
                        // console.log('Payment transaction prepared...');
                        const { signedTransaction } = api.sign(
                          prepared.txJSON,
                          ripplesecret
                        );
                        // console.log('Payment transaction signed...');
                        api.submit(signedTransaction).then((result) => {
                          console.log(result);
                          if (
                            result &&
                            typeof result.tx_json != "undefined" &&
                            typeof result.tx_json.hash != "undefined"
                          ) {
                            res.json({
                              status: true,
                              message:
                                "Amount Withdraw successfully transaction id is " +
                                result.tx_json.hash,
                            });
                          }
                        });
                      });
                  });
                } else {
                  res.json({ status: false, message: "error" });
                }
              });
            })
            .catch();
        } else if (currency == "ETH") {
          var useraddress = keys.ethaddress;
          var userkey = keys.ethkey;

          var account1 = req.body.adminaddress;
          var privkey = req.body.privkey;
          var cryptoPass = req.body.cryptoPass;
          var useraddress = req.body.useraddress;
          var amount = req.body.amount;

          var header = { "Content-Type": "application/json" };
          var args = {
            adminaddress: keys.ethaddress,
            privkey: keys.ethkey,
            cryptoPass: keys.cryptoPass,
            type: "sendtoaddress",
            account1: toaddress,
            amount: withdrawamount,
          };
          const options = {
            url: "http://78.141.220.37:3000/ethnode",
            method: "POST",
            headers: header,
            body: JSON.stringify(args),
          };
          request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
              const result = JSON.parse(body);
              if (result.status) {
                var txHash = result.txHash;
                res.json({
                  status: true,
                  message:
                    "Amount Withdraw successfully transaction id is " + txHash,
                });
              } else {
                res.json({ status: true, message: result.message });
              }
            }
          });
        }
      } else {
        res.json({ success: false, message: "OTP is invalid or expired" });
      }
    }
  );
});
router.post("/sendotp", (req, res) => {
  const generate_number = Math.floor(100000 + Math.random() * 900000);
  Admincontrol.findOne({}, function (err, userdet) {
    var tonumber = userdet.phonenumber;
    client.messages
      .create({
        from: keys.TWILIO_PHONE_NUMBER,
        to: tonumber,
        body: "Your " + keys.fromName + " OTP Code is: " + generate_number,
      })
      .then(() => {
        var userid = userdet._id;
        var updateObj = {
          otp: generate_number,
          otptime: new Date(),
        };

        Admincontrol.findOneAndUpdate(
          {
            _id: userdet._id,
          },
          updateObj,
          {
            new: true,
          },
          function (err, user) {
            if (!err) {
              return res.status(200).json({
                message:
                  "OTP sent successfully, It is only valid for 2 minutes",
                success: true,
              });
            }
          }
        );
      })
      .catch((err) => {
        console.log(err);
        return res.status(200).json({
          message: "Something went wrong try again later",
          success: false,
        });
      });
  });
});

router.post("/adminlogin", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const email = req.body.email;
  const password = req.body.password;
  Admincontrol.findOne({
    email: req.body.email,
  }).then((user) => {
    if (!user) {
      return res.status(404).json({
        email: "Email not found",
      });
    }

    bcrypt.compare(password, user.password).then((isMatch) => {
      if (isMatch) {
        const payload = {
          id: user.id,
          name: user.name,
          moderator: user.moderator,
        };
        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: 31556926, // 1 year in seconds
          },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token,
            });
          }
        );
      } else {
        return res.status(400).json({
          password: "Password incorrect",
        });
      }
    });
  });
});

router.post("/otplogin", (req, res) => {
  var patternfront = req.body.pattern;
  var otp = req.body.otp;
  Admincontrol.findOne({
    phonenumber: req.body.mobilenumber,
    otptime: {
      $gt: new Date(new Date().getTime() - 120000),
    },
    otp: otp,
  }).then((user) => {
    if (user) {
      bcrypt.compare(patternfront, user.patternlock).then((isMatch) => {
        if (isMatch) {
          if (
            user.otp === req.body.otp &&
            user.phonenumber == req.body.mobilenumber
          ) {
            const payload = {
              id: user._id,
              name: user.name,
              moderator: user.moderator,
            };
            jwt.sign(
              payload,
              keys.secretOrKey,
              {
                expiresIn: 31556926, // 1 year in seconds
              },
              (err, token) => {
                res.json({
                  success: true,
                  token: "Bearer " + token,
                });
              }
            );
          } else {
            return res.status(400).json({
              pattern: "Otp incorrect",
            });
          }
        } else {
          return res.status(400).json({
            pattern: "Pattern is  incorrect",
          });
        }
      });
    } else {
      return res.status(400).json({
        otp: "OTP is invalid",
      });
    }
  });
});

router.post("/gettransactions", (req, res) => {
  var currency = req.body.currency;
  if (currency == "BTC" || currency == "LTC" || currency == "BCH") {
    var header = { "Content-Type": "application/json" };
    var args = { type: "listtransactions" };
    var url =
      currency == "BTC"
        ? "http://136.244.107.56:3000/btcnode"
        : currency == "LTC"
        ? "http://136.244.105.184:3000/ltcnode"
        : currency == "BCH"
        ? "http://165.227.84.53:3003/bchnode"
        : "";
    const options = {
      url: url,
      method: "POST",
      headers: header,
      body: JSON.stringify(args),
    };
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        const info = JSON.parse(body);

        var i = 0;
        info.result.forEach(function (singleres) {
          info.result[i].timereceived = moment
            .unix(singleres.timereceived)
            .format("YYYY-MM-DD H:s");
          if (i == info.result.length - 1) {
            res.json({ status: true, data: info.result });
          }
          i++;
        });
        // res.json({status:true,data:info.result});
      } else {
        res.json({ status: false, message: error });
      }
    });
  } else if (currency == "ETH") {
    var max_blocknumber = 6091041;
    var ethaddress = keys.ethaddress;
    getJSON(
      "https://api.etherscan.io/api?apiKey=V1DJUVHQJV4GUCB97RH35MG9T3RWI4RBI5&module=account&action=txlist&address=" +
        ethaddress +
        "&startblock=" +
        max_blocknumber +
        "&endblock=latest",
      function (errorBal, response) {
        if (response.message == "OK") {
          arrayvalue = [];
          if (response.result.length > 0) {
            var i = 0;
            response.result.forEach(function (singleres) {
              var rowvalue = {};
              rowvalue["txid"] = singleres.hash;
              rowvalue["timereceived"] = moment
                .unix(singleres.timeStamp)
                .format("YYYY-MM-DD H:s");
              rowvalue["amount"] = web3.utils.fromWei(singleres.value, "ether");
              if (singleres.from.toLowerCase() == ethaddress.toLowerCase()) {
                rowvalue["category"] = "send";
                rowvalue["address"] = singleres.to;
              } else {
                rowvalue["category"] = "receive";
                rowvalue["address"] = singleres.from;
              }
              arrayvalue.push(rowvalue);
              if (i == response.result.length - 1) {
                res.json({ status: true, data: arrayvalue });
              }
              i++;
            });
          }
        }
      }
    );
  } else if (currency == "XRP") {
    api
      .connect()
      .then(() => {
        return api.getServerInfo();
      })
      .then((serverInfo) => {
        const ledgers = serverInfo.completeLedgers.split("-");
        const minLedgerVersion = Number(ledgers[0]);
        const maxLedgerVersion = Number(ledgers[1]);

        const myAddress = "rnyhG4bDxgKg78uqsrDo4dL1DHFQtG5gxi";

        return api
          .getTransactions(myAddress, {
            minLedgerVersion,
            maxLedgerVersion,
          })
          .then((transaction) => {
            arrayvalue = [];
            for (var i = 0; i < transaction.length; i++) {
              var txid = transaction[i].id;
              var amount = transaction[i].specification.source.maxAmount.value;
              var rowvalue = {};
              rowvalue["txid"] = txid;
              rowvalue["timereceived"] = moment(
                transaction[i].outcome.timestamp
              ).format("YYYY-MM-DD H:s");
              rowvalue["amount"] = amount;
              if (
                transaction[
                  i
                ].specification.destination.address.toLowerCase() ==
                myAddress.toLowerCase()
              ) {
                rowvalue["category"] = "receive";
                rowvalue["address"] =
                  transaction[i].specification.source.address;
              } else {
                rowvalue["category"] = "send";
                rowvalue["address"] =
                  transaction[i].specification.destination.address;
              }
              arrayvalue.push(rowvalue);
              if (i == transaction.length - 1) {
                res.json({ status: true, data: arrayvalue });
              }
              i++;
            }
          });
      })
      .then(() => {
        return api.disconnect();
      })
      .then(() => {
        console.log("done and disconnected.");
      });
  }
});
router.post("/changepattern", (req, res) => {
  const { errors, isValid } = validatePatternInput(req.body, "pattern");
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const id = req.body._id;
  Admincontrol.findById(id).then((user) => {
    bcrypt.compare(req.body.oldpattern, user.patternlock).then((isMatch) => {
      if (isMatch) {
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(req.body.pattern, salt, (err, hash) => {
            if (err) throw err;
            let update = { patternlock: hash };
            Admincontrol.update(
              { _id: req.body._id },
              { $set: update },
              function (err, result) {
                if (err) {
                  return res
                    .status(400)
                    .json({ message: "Unable to update user." });
                } else {
                  return res.status(200).json({
                    message: "Pattern updated successfully. Refreshing data...",
                    success: true,
                  });
                }
              }
            );
          });
        });
      } else {
        return res.status(400).json({ oldpattern: "Old oldpattern is wrong." });
      }
    });
  });
});

router.post("/resetChangepattern", (req, res) => {
  const { errors, isValid } = validatePatternInput(req.body, "reset");
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const phone = req.body.phone;
  Admincontrol.findOne({ phonenumber: phone }).then((user) => {
    if (user) {
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(req.body.pattern, salt, (err, hash) => {
          if (err) throw err;
          let update = { patternlock: hash };
          Admincontrol.update(
            { phonenumber: phone },
            { $set: update },
            function (err, result) {
              if (err) {
                return res
                  .status(400)
                  .json({ message: "Unable to update user." });
              } else {
                return res.status(200).json({
                  message: "Pattern updated successfully. Refreshing data...",
                  success: true,
                  type: "reset",
                });
              }
            }
          );
        });
      });
    }
  });
});

router.post("/adminadd", (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body, "register");
  if (!isValid) {
    return res.status(400).json(errors);
  }
  Admincontrol.findOne({
    email: req.body.email,
  }).then((user) => {
    if (user) {
      return res.status(400).json({
        email: "Email already exists",
      });
    } else {
      const newUser = new Admincontrol({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
      });
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then((user) => {
              return res.status(200).json({
                message: "Admin added successfully. Refreshing data...",
              });
            })
            .catch((err) => console.log(err));
        });
      });
    }
  });
});

router.get("/adminget/:id", (req, res) => {
  const id = req.params.id;
  Admincontrol.findById(id).then((user) => {
    if (user) {
      return res.status(200).send(user);
    }
  });
});

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var upload = multer({
  storage: storage,
});

router.post("/adminprofileupload", upload.single("file"), (req, res) => {
  const file = req.file; // file passed from client
  const meta = req.body; // all other values passed from the client, like name, etc..
  const { errors, isValid } = validateUpdateUserInput(req.body, "profile");
  if (!isValid) {
    return res.status(400).json(errors);
  }
  console.log(meta);
  console.log(file);
  let update = {};
  if (file != "" && file != undefined) {
    const profile = req.file.filename;
    update = {
      name: req.body.name,
      phonenumber: req.body.phonenumber,
      profile: profile,
    };
  } else {
    update = {
      name: req.body.name,
      phonenumber: req.body.phonenumber,
    };
  }
  console.log(update);
  const _id = req.body._id;

  Admincontrol.update(
    {
      _id: _id,
    },
    {
      $set: update,
    },
    function (err, result) {
      if (err) {
        return res.status(400).json({
          message: "Unable to update user.",
        });
      } else {
        return res.status(200).json({
          message: "User updated successfully. Refreshing data...",
          success: true,
        });
      }
    }
  );
});

router.post("/controforgot", (req, res) => {
  var phone = req.body.phone;
  var otp = req.body.otp;
  Admincontrol.findOne({
    phonenumber: req.body.phone,
    otptime: {
      $gt: new Date(new Date().getTime() - 120000),
    },
    otp: otp,
  }).then((user) => {
    if (user) {
      return res.status(200).json({
        message: "Reset pattern now",
        success: true,
      });
    } else {
      return res.status(400).json({
        otp: "Phone number or OTP is invalid or otp expired",
      });
    }
  });
});

router.post("/sendotpadminlogin", (req, res) => {
  const generate_number = Math.floor(100000 + Math.random() * 900000);

  var tonumber = req.body.phone;
  client.messages
    .create({
      from: keys.TWILIO_PHONE_NUMBER,
      to: tonumber,
      body: "Your " + keys.fromName + " OTP Code is: " + generate_number,
    })
    .then(() => {
      var userid = req.body._id;
      var updateObj = {
        otp: generate_number,
        phonenumber: tonumber,
        otptime: new Date(),
      };
      // Admincontrol.findByIdAndUpdate(userid, updateObj, {
      //   new: true
      // }, function (err, user) {
      //   return res.status(200).json({
      //     message: 'OTP sent successfully, It is only valid for 2 minutes',
      //     success: true
      //   });
      // });

      Admincontrol.findOneAndUpdate(
        {
          phonenumber: req.body.phone,
        },
        updateObj,
        {
          new: true,
        },
        function (err, user) {
          if (!err) {
            return res.status(200).json({
              message: "OTP sent successfully, It is only valid for 2 minutes",
              success: true,
            });
          }
        }
      );
    })
    .catch((err) => {
      console.log(err);
      return res.status(200).json({
        message: "Something went wrong try again later",
        success: false,
      });
    });
});

router.post("/adminrevenue", async (req, res) => {
  try {
    var reqBody = req.body;
    var filter_by = {};
    var filter_by1 = {};
    if (reqBody.fc != "off" && reqBody.fc != undefined) {
      filter_by["currency"] = reqBody.fc;
      console.log("aa");
    }

    if (reqBody.sc != "off" && reqBody.sc != undefined) {
      filter_by["currency"] = reqBody.sc;
      console.log("BBB");
    }

    if (
      reqBody.date &&
      reqBody.date != "NaN-NaN-NaN" &&
      reqBody.date != "1970-01-01"
    ) {
      var datenew = reqBody.date + "T00:00:00.000Z";

      var year = moment(reqBody.date).format("YYYY");

      var month = moment(reqBody.date).format("MM");

      console.log(year + month, "datenew");
      filter_by1 = {
        $expr: {
          $and: [
            { $eq: [{ $year: "$created_date" }, Number(year)] },
            { $eq: [{ $month: "$created_date" }, Number(month)] },
          ],
        },
      };
    }

    const filterby_final = { ...filter_by, ...filter_by1 };

    console.log(filterby_final, "filterby_final");

    Admin_Revenue.find(filterby_final)
      .sort({ _id: -1 })
      .then((result) => {
        if (result) {
          var resData = [];
          var totalfee = 0;
          for (var i = 0; i < result.length; i++) {
            const created_date = moment(result[i].created_date).format(
              "DD-MMM-YYYY"
            );

            const created_month = moment(result[i].created_date).format(
              "MMM-YYYY"
            );

            var _id = result[i]._id ? result[i]._id : "";
            var currency = result[i].currency;
            var fee = result[i].fee;
            var amount = result[i].amount;
            var type = result[i].type;
            var totalfee = totalfee + fee;
            var trade_id = result[i].trade_id;
            var email = result[i].email;
            var resObj = {
              created_date: created_date,
              created_month: created_month,
              _id: _id,
              currency: currency,
              amount: amount,
              fee: fee,
              type: type,
              trade_id: trade_id,
              email: email,
            };
            resData.push(resObj);
          }
          return res.status(200).json({
            status: true,
            data: resData,
            totalfee: totalfee,
          });
        }
      });
  } catch (err) {}
});

module.exports = router;
