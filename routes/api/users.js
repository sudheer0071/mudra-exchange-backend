const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const async = require("async");
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");
const validateUpdateUserInput = require("../../validation/updateUser");
// const validateEmailtemplateInput = require('../../validation/emailtemplate');
const validateForgotInput = require("../../validation/forgot");
const validateCmsInput = require("../../validation/cms");
const validateFaqInput = require("../../validation/faq");
const validateUpdateSettingsInput = require("../../validation/settings");
const validateSupportReplyInput = require("../../validation/support");
const Transaction = require("../../models/Transaction");
const position_table = require("../../models/position_table");
// const Cms = require("../../models/cms");
import Cms from '../../models/cms';
const User = require("../../models/User");
const Faq = require("../../models/faq");
const Settings = require("../../models/settings");
const Contact = require("../../models/contactus");
const Support = require("../../models/support");
const Bonus = require("../../models/Bonus");
const Emailtemplates = require("../../models/emailtemplate");
const Currency = require("../../models/currency");
const nodemailer = require("nodemailer");
const multer = require("multer");
const { ObjectId } = require("mongodb");
const Chat = require("../../models/Chat");
const FeeTable = require("../../models/FeeTable");
const RequestTable = require("../../models/Request");
const Web3 = require("web3");
const request = require("request");
const Assets = require("../../models/Assets");
const perpetual = require("../../models/perpetual");

const stakingOrder = require("../../models/stakingOrder");

const web3 = new Web3(keys.infura);
const CryptoJS = require("crypto-js");
//ripple
const RippleAPI = require("ripple-lib").RippleAPI;
const api = new RippleAPI({ server: keys.ripplehost });
var rp = require("request-promise");

router.get("/test", (req, res) => {
  res.json({ statue: "success123" });
});

router.post("/user-add", (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body, "register");
  if (!isValid) {
    return res.status(400).json(errors);
  }
  User.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      return res.status(400).json({ email: "Email already exists" });
    } else {
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
      });
      /*bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => {
              return res.status(200).json({ message: 'User added successfully. Refreshing data...' })
            }).catch(err => console.log(err));
        });
      });*/
      newUser
        .save()
        .then((user) => {
          return res
            .status(200)
            .json({ message: "User added successfully. Refreshing data..." });
        })
        .catch((err) => console.log(err));
    }
  });
});

router.post("/sendotppasswordchange", (req, res) => {
  const generate_number = Math.floor(100000 + Math.random() * 900000);
  // var email = req.body.email;

  var userid = req.body._id;
  var updateObj = {
    otp: generate_number,
    otptime: new Date(),
  };

  User.findOneAndUpdate(
    {
      _id: userid,
    },
    updateObj,
    {
      new: true,
    },
    function (err, user) {
      if (!err) {
        // console.log("userssss",user);
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
          to: user.email, // list of receivers
          subject: "OTP", // Subject line
          html: "<h1>Your OTP is " + generate_number + "</h1>", // html body
        };
        transporter.sendMail(mailOptions, function (error, info) {
          console.log("errror", error);
          console.log("infoorrr", info);
          return res.status(200).json({
            message: "OTP sent successfully, It is only valid for 2 minutes",
            success: true,
          });
        });
      }
    }
  );

  // });

  // client.messages
  //     .create({
  //         from: keys.TWILIO_PHONE_NUMBER,
  //         to: tonumber,
  //         body: 'Your ' + keys.fromName + ' OTP Code is: ' + generate_number
  //     })
  //     .then(() => {
  //         var userid = req.body._id;
  //         var updateObj = {
  //             "otp": generate_number,
  //             "phonenumber": tonumber,
  //             "otptime": new Date()
  //         }
  //
  //
  //         Admincontrol.findOneAndUpdate({
  //             phonenumber: req.body.phone
  //         }, updateObj, {
  //             new: true
  //         }, function (err, user) {
  //             if (!err) {
  //                 return res.status(200).json({
  //                     message: 'OTP sent successfully, It is only valid for 2 minutes',
  //                     success: true
  //                 });
  //             }
  //
  //         });
  //
  //
  //     })
  //     .catch(err => {
  //         console.log(err);
  //         return res.status(200).json({
  //             message: 'Something went wrong try again later',
  //             success: false
  //         });
  //     });
});

router.post("/changepassword", (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body, "password");
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const id = req.body._id;
  // User.findById(id).then(user => {
  User.findOne({ _id: id }, function (er1, user) {
    if (user.otp == req.body.otpnew) {
      /*bcrypt.compare(req.body.oldpassword, user.password).then(isMatch => {
        if (isMatch) {
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(req.body.password, salt, (err, hash) => {
              if (err) throw err;
              let update = { 'password': hash };
              User.update({ _id: req.body._id }, { $set: update }, function (err, result) {
                if (err) {
                  return res.status(400).json({ message: 'Unable to update user.' });
                } else {
                  return res.status(200).json({ message: 'Password updated successfully. Refreshing data...', success: true });
                }
              });
            });
          });
        } else {
          return res
            .status(400)
            .json({ oldpassword: 'Old password is wrong.' });
        }
      });*/
      if (user.authenticate(req.body.oldpassword)) {
        user.password = req.body.password;
        user.save(function (err, updatedPassword) {
          if (err) {
            return res.status(400).json({ message: "Unable to update user." });
          } else {
            return res.status(200).json({
              message: "Password updated successfully. Refreshing data...",
              success: true,
            });
          }
        });
      } else {
        return res.status(400).json({ oldpassword: "Old password is wrong." });
      }
    } else {
      return res.status(400).json({ otpnew: "OTP is wrong" });
    }
  });
});

router.get("/userget/:id", (req, res) => {
  const id = req.params.id;
  User.findById(id)
    .select(["-password"])
    .then((user) => {
      if (user) {
        return res.status(200).send(user);
      }
    });
});

function EmailfunctionAccept(email) {
  async.waterfall(
    [
      function (done) {
        User.findOne({
          email: email,
        }).then((user) => {
          var jsonfilter = {
            identifier: "Verif_approve",
          };
          var logo = keys.baseUrl + "Logo-small.png";
          Emailtemplates.findOne(
            jsonfilter,
            {
              _id: 0,
            },
            function (err, templates) {
              if (templates) {
                if (templates.content) {
                  templateData = templates;
                  templateData.content = templateData.content.replace(
                    /##templateInfo_name##/g,
                    user.email
                  );
                  templateData.content = templateData.content.replace(
                    /##templateInfo_appName##/g,
                    keys.siteName
                  );
                  templateData.content = templateData.content.replace(
                    /##templateInfo_logo##/g,
                    logo
                  );
                  done();
                }
              }
            }
          );
        });
      },
      function (done) {
        var smtpConfig = {
          // service: keys.serverName,
          // host: keys.host, // Amazon email SMTP hostname
          // auth: {
          //   user: keys.email,
          //   pass: keys.password,
          // },
          service: keys.serverName,
          auth: {
            user: keys.email,
            pass: keys.password,
          },
          host: keys.host,
          port: keys.port,
        };
        var transporter = nodemailer.createTransport(smtpConfig);

        var mailOptions = {
          from: keys.fromName + "<" + keys.fromemail + ">", // sender address
          to: email, // list of receivers
          subject: templateData.subject, // Subject line
          html: templateData.content, // html body
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            return console.log(error);
          }
        });
        done();
      },
    ],
    function (err) {}
  );
}

function EmailfunctionReject(email, reason) {
  async.waterfall(
    [
      function (done) {
        User.findOne({
          email: email,
        }).then((user) => {
          var jsonfilter = {
            identifier: "Verif_reject",
          };
          var logo = keys.baseUrl + "/uploads/logoadmin.png";
          Emailtemplates.findOne(
            jsonfilter,
            {
              _id: 0,
            },
            function (err, templates) {
              if (templates) {
                if (templates.content) {
                  templateData = templates;
                  templateData.content = templateData.content.replace(
                    /##templateInfo_name##/g,
                    user.email
                  );
                  templateData.content = templateData.content.replace(
                    /##templateInfo_appName##/g,
                    keys.siteName
                  );
                  templateData.content = templateData.content.replace(
                    /##templateInfo_logo##/g,
                    logo
                  );
                  templateData.content = templateData.content.replace(
                    /##templateInfo_reason##/g,
                    reason
                  );
                  done();
                }
              }
            }
          );
        });
      },
      function (done) {
        var smtpConfig = {
          // service: keys.serverName,
          // host: keys.host, // Amazon email SMTP hostname
          // auth: {
          //   user: keys.email,
          //   pass: keys.password,
          // },
          service: keys.serverName,
          auth: {
            user: keys.email,
            pass: keys.password,
          },
          host: keys.host,
          port: keys.port,
        };
        var transporter = nodemailer.createTransport(smtpConfig);
        var mailOptions = {
          from: keys.fromName + "<" + keys.fromemail + ">", // sender address
          to: email, // list of receivers
          subject: templateData.subject, // Subject line
          html: templateData.content, // html body
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            return console.log(error);
          }
        });
        done();
      },
    ],
    function (err) {}
  );
}

router.post("/IDverifiedaccept", (req, res) => {
  console.log("!!!!!!!!!!!", req.body);
  const _id = req.body._id;
  update = {
    IDstatus: "Verified",
  };
  User.findOneAndUpdate(
    {
      _id: _id,
    },
    {
      $set: update,
    },
    { new: true },

    function (err, result) {
      if (err) {
        return res.status(400).json({
          message: "Unable to Accept the ID.",
        });
      } else {
        if (
          result.IDstatus == "Verified" &&
          result.Addresstatus == "Verified" &&
          result.Photostatus == "Verified"
        ) {
          var updateVal = {};
          updateVal.verifiedstatus = "Verified";

          User.findOneAndUpdate(
            {
              _id: _id,
            },
            updateVal,
            { new: true },

            function (err, result) {
              if (result) {
                // EmailfunctionAccept(result.email);
                return res.status(200).json({
                  message: "All the Proofs have been verified",
                  success: true,
                  updateddata: result,
                });
              }
            }
          );
        } else {
          return res.status(200).json({
            message: "ID  Succesfully verified",
            success: true,
            updateddata: result,
          });
        }
      }
    }
  );
});

router.post("/IDverifiedreject", (req, res) => {
  const reason = req.body.reason;

  const _id = req.body._id;
  update = {
    IDstatus: "Rejected",
    verifiedstatus: "Rejected",
  };
  User.findOneAndUpdate(
    {
      _id: _id,
    },
    {
      $set: update,
    },

    function (err, result) {
      if (err) {
        return res.status(400).json({
          message: "Unable to Accept the ID.",
        });
      } else {
        // EmailfunctionReject(result.email, reason);
        return res.status(200).json({
          message: "ID  Succesfully Rejected",
          success: true,
          updateddata: result,
        });
      }
    }
  );
});

router.post("/addressaccept", (req, res) => {
  const _id = req.body._id;
  update = {
    Addresstatus: "Verified",
  };

  User.findOneAndUpdate(
    {
      _id: _id,
    },
    {
      $set: update,
    },
    { new: true },

    function (err, result) {
      if (err) {
        return res.status(400).json({
          message: "Unable to Accept the Address.",
        });
      } else {
        if (
          result.IDstatus == "Verified" &&
          result.Addresstatus == "Verified" &&
          result.Photostatus == "Verified"
        ) {
          var updateVal = {};
          updateVal.verifiedstatus = "Verified";
          User.findOneAndUpdate(
            {
              _id: _id,
            },
            updateVal,
            { new: true },

            function (err, result) {
              if (result) {
                // EmailfunctionAccept(result.email);

                return res.status(200).json({
                  message: "All the Proofs have been verified",
                  success: true,
                  updateddata: result,
                });
              }
            }
          );
        } else {
          return res.status(200).json({
            message: "Address  Succesfully Verified",
            success: true,
            updateddata: result,
          });
        }
      }
    }
  );
});

router.post("/addressreject", (req, res) => {
  const _id = req.body._id;
  const reason = req.body.reason;
  update = {
    Addresstatus: "Rejected",
    verifiedstatus: "Rejected",
  };
  User.findOneAndUpdate(
    {
      _id: _id,
    },
    {
      $set: update,
    },
    function (err, result) {
      if (err) {
        return res.status(400).json({
          message: "Unable to REject the Address.",
        });
      } else {
        // EmailfunctionReject(result.email, reason);

        return res.status(200).json({
          message: "Address   Rejected",
          success: true,
          updateddata: result,
        });
      }
    }
  );
});

router.post("/photoaccept", (req, res) => {
  const _id = req.body._id;
  update = {
    Photostatus: "Verified",
  };
  User.findOneAndUpdate(
    {
      _id: _id,
    },
    {
      $set: update,
    },
    { new: true },
    function (err, result) {
      if (err) {
        return res.status(400).json({
          message: "Unable to Accept the Photo ID.",
        });
      } else {
        if (
          result.IDstatus == "Verified" &&
          result.Addresstatus == "Verified" &&
          result.Photostatus == "Verified"
        ) {
          var updateVal = {};
          updateVal.verifiedstatus = "Verified";
          User.findOneAndUpdate(
            {
              _id: _id,
            },
            updateVal,
            { new: true },

            function (err, result) {
              if (result) {
                // EmailfunctionAccept(result.email);

                return res.status(200).json({
                  message: "All the Proofs have been verified",
                  success: true,
                  updateddata: result,
                });
              }
            }
          );
        } else {
          return res.status(200).json({
            message: "PhotoID Succesfully  Verified",
            success: true,
            updateddata: result,
          });
        }
      }
    }
  );
});

router.post("/photoreject", (req, res) => {
  const _id = req.body._id;
  const reason = req.body.reason;
  update = {
    Photostatus: "Rejected",
    verifiedstatus: "Rejected",
  };
  User.findOneAndUpdate(
    {
      _id: _id,
    },
    {
      $set: update,
    },
    { new: true },

    function (err, result) {
      if (err) {
        return res.status(400).json({
          message: "Unable to Reject the Photo ID.",
        });
      } else {
        // EmailfunctionReject(result.email, reason);

        return res.status(200).json({
          message: "PhotoID   Rejected",
          success: true,
          updateddata: result,
        });
      }
    }
  );
});

router.post("/forgot", (req, res) => {
  const { errors, isValid } = validateForgotInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  User.findOne({ email: req.body.email, moderator: "2" }).then((user) => {
    if (!user) {
      return res.status(400).json({ email: "Email not exists" });
    } else {
      async.waterfall(
        [
          function (done) {
            var jsonfilter = { identifier: "User_forgot" };
            var logo = keys.baseUrl + "Logo-small.png";
            Emailtemplates.findOne(
              jsonfilter,
              { _id: 0 },
              function (err, templates) {
                if (templates.content) {
                  templateData = templates;
                  templateData.content = templateData.content.replace(
                    /##templateInfo_name##/g,
                    user.name
                  );
                  templateData.content = templateData.content.replace(
                    /##templateInfo_appName##/g,
                    keys.siteName
                  );
                  templateData.content = templateData.content.replace(
                    /##templateInfo_logo##/g,
                    logo
                  );
                  var link_html = keys.frontUrl + "resetpassword/" + user._id;
                  templateData.content = templateData.content.replace(
                    /##templateInfo_url##/g,
                    link_html
                  );
                  done();
                }
              }
            );
          },
          function (done) {
            var smtpConfig = {
              // service: keys.serverName,
              host: keys.host, // Amazon email SMTP hostname
              auth: {
                user: keys.email,
                pass: keys.password,
              },
            };
            var transporter = nodemailer.createTransport(smtpConfig);

            var mailOptions = {
              from: keys.fromName + "<" + keys.fromemail + ">", // sender address
              to: req.body.email, // list of receivers
              subject: templateData.subject, // Subject line
              html: templateData.content, // html body
            };
            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                return console.log(error);
              } else {
                return res.status(200).json({
                  message: "Reset Password link sent to Registered Mail I...",
                });
              }
            });
          },
        ],
        function (err) {}
      );
    }
  });
});

router.post("/user-data", (req, res) => {
  User.find({})
    .select(["-password"])
    .sort({ _id: -1 })
    .then((user) => {
      if (user) {
        return res.status(200).send(user);
      }
    });
});

router.post("/bonus-data", (req, res) => {
  Bonus.find({})
    .populate({ path: "userId", select: "email" })
    .populate({ path: "referId", select: "email" })
    .sort({ createdDate: -1 })
    .then((result) => {
      if (result) {
        resultarr = [];
        for (i = 0; i < result.length; i++) {
          var userId = result[i].userId
            ? result[i].userId.email
            : result[i]._id;
          var referId = result[i].referId ? result[i].referId.email : "";
          var type = result[i].type ? result[i].type : "";
          var bonus_amount = result[i].bonus_amount
            ? result[i].bonus_amount
            : "";
          var depositamount = result[i].depositamount
            ? result[i].depositamount
            : "";
          var _id = result[i]._id ? result[i]._id : "";
          var createdDate = result[i].createdDate ? result[i].createdDate : "";

          var data1 = new Date(createdDate);
          let date =
            data1.getFullYear() +
            "-" +
            (data1.getMonth() + 1) +
            "-" +
            data1.getDate() +
            " " +
            data1.getHours() +
            ":" +
            data1.getMinutes() +
            ":" +
            data1.getSeconds();
          type =
            type == "0"
              ? "Sign up"
              : type == "1"
              ? "Referral"
              : type == "2"
              ? "Deposit"
              : type == "3"
              ? "Social media promotion"
              : "";

          resultobj = {
            email: userId,
            referId: referId,
            type: type,
            createdDate: date,
            bonus_amount: parseFloat(bonus_amount).toFixed(8),
            depositamount: parseFloat(depositamount).toFixed(8),
          };

          resultarr.push(resultobj);
        }
        return res.status(200).send(resultarr);
      }
    });
});

router.post("/user-delete", (req, res) => {
  User.deleteOne({ _id: req.body._id }).then((user) => {
    if (user) {
      return res.status(200).json({
        message: "User deleted successfully. Refreshing data...",
        success: true,
      });
    }
  });
});

router.post("/user-update", (req, res) => {
  const { errors, isValid } = validateUpdateUserInput(req.body, "reg");
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const _id = req.body._id;
  /*User.findOne({ _id }).then(user => {
    if (user) {
      if (req.body.password !== '') {
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(req.body.password, salt, (err, hash) => {
            if (err) throw err;
            user.password = hash;
          });
        });
      }
      let update = { 'name': req.body.name, 'email': req.body.email, 'password': user.password };
      User.update({ _id: _id }, { $set: update }, function (err, result) {
        if (err) {
          return res.status(400).json({ message: 'Unable to update user.' });
        } else {
          return res.status(200).json({ message: 'User updated successfully. Refreshing data...', success: true });
        }
      });
    } else {
      return res.status(400).json({ message: 'Now user found to update.' });
    }
  });*/

  User.findOne({ _id: _id }, function (er1, user) {
    if (req.body.password !== "") {
      user.password = req.body.password;
      user.save(function (err, updated) {
        if (err) {
          return res.status(400).json({ message: "Unable to update user." });
        } else {
          return res.status(200).json({
            message: "User updated successfully. Refreshing data...",
            success: true,
          });
        }
      });
    } else {
      return res.status(400).json({ message: "No user found to update." });
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

var upload = multer({ storage: storage });

router.post("/profileupload", upload.single("file"), (req, res) => {
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
    update = { name: req.body.name, phonenumber: req.body.phonenumber };
  }
  console.log(update);
  const _id = req.body._id;

  User.update({ _id: _id }, { $set: update }, function (err, result) {
    if (err) {
      return res.status(400).json({ message: "Unable to update user." });
    } else {
      return res.status(200).json({
        message: "User updated successfully. Refreshing data...",
        success: true,
      });
    }
  });
});

router.post("/login", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: req.body.email }).then((user) => {
    if (!user) {
      return res.status(404).json({ email: "Email not found" });
    }
    /*bcrypt.compare(password, user.password).then(isMatch => {
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
            expiresIn: 31556926 // 1 year in seconds
          },
          (err, token) => {
            res.json({
              success: true,
              token: 'Bearer ' + token
            });
          }
        );
      } else {
        return res
          .status(400)
          .json({ password: 'Password incorrect' });
      }
    });*/
    if (user.authenticate(password)) {
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
      // return res.status(200).json({ message: 'login success' })
    } else {
      return res.status(200).json({ message: "incorrect password" });
    }
  });
});

// router.get('/send-mail', (req, res) => {
//   // console.log('::::::varuthu')

//    var smtpConfig = {
//                       host: keys.host, // Amazon email SMTP hostname
//                       auth: {
//                         user: keys.email,
//                         pass: keys.password,
//                       },
//                     };
//       var transporter = nodemailer.createTransport(smtpConfig);

//       var mailOptions = {
//         from: keys.fromName + "<" + keys.fromemail + ">", // sender address
//         to: 'sridhar@britisheducationonline.org', // list of receivers
//         subject: 'Hi', // Subject line
//         html: 'Varuthju', // html body
//       };
//       transporter.sendMail(mailOptions, function (error, info) {
//         console.log(error,'ifERROR');
//           console.log(info,'ifinfo');
//         if(error) {
//           console.log(error,'ERROR');
//           console.log(info,'info');
//         }
//       });

// });

//Emailtemplates
router.post("/template-add", (req, res) => {
  // const { errors, isValid } = validateEmailtemplateInput(req.body);
  // if (!isValid) {
  //   return res.status(400).json(errors);
  // }
  Emailtemplates.findOne({ identifier: req.body.identifier }).then((user) => {
    if (user) {
      return res.status(400).json({ identifier: "Identifier already exists" });
    } else {
      const newTemplate = new Emailtemplates({
        identifier: req.body.identifier,
        subject: req.body.subject,
        content: req.body.content,
      });
      newTemplate
        .save()
        .then((user) => {
          return res.status(200).json({
            message: "Template added successfully. Refreshing data...",
          });
        })
        .catch((err) => console.log(err));
    }
  });
});

router.post("/template-data", (req, res) => {
  Emailtemplates.find({}).then((emailtemplate) => {
    if (emailtemplate) {
      return res.status(200).send(emailtemplate);
    }
  });
});

router.post("/template-delete", (req, res) => {
  Emailtemplates.deleteOne({ _id: req.body._id }).then((emailtemplate) => {
    if (emailtemplate) {
      return res.status(200).json({
        message: "Template deleted successfully. Refreshing data...",
        success: true,
      });
    }
  });
});

router.post("/template-update", (req, res) => {
  const { errors, isValid } = validateEmailtemplateInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const _id = req.body._id;
  console.log(req.body);
  let update = {
    identifier: req.body.identifier,
    subject: req.body.subject,
    content: req.body.content,
  };
  Emailtemplates.update({ _id: _id }, { $set: update }, function (err, result) {
    if (err) {
      return res.status(400).json({ message: "Unable to update template." });
    } else {
      return res.status(200).json({
        message: "Templates updated successfully. Refreshing data...",
        success: true,
      });
    }
  });
});

//CMS

router.post("/cms-add", async (req, res) => {
  // const { errors, isValid } = validateCmsInput(req.body);
  // if (!isValid) {
  //   return res.status(400).json(errors);
  // }
  console.log("Cms..//////// ", Cms);
  console.log(req.body);

  try {
    const cms = await Cms?.findOne({ identifier: req.body.identifier });
    if (cms) {
      console.log("CMS.///// ", cms)
      return res.status(400).json({ identifier: "Identifier already exists" });
    } else {
      console.log("CMS.///// inside/// ", cms)
      const newCms = new Cms({
        title:req.body.title,
        identifier: req.body.identifier,
        subject: req.body.subject,
        content: req.body.content,
        metatitle:req.body.metatitle,
        page:req.body.page,
        order:req.body.order
      });

      await newCms.save();
      return res.status(200).json({
        message: "CMS added successfully. Refreshing data...",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/cms-data", (req, res) => {
  Cms.find({}).then((cms) => {
    if (cms) {
      return res.status(200).send(cms);
    }
  });
});

router.post("/cms-delete", (req, res) => {
  Cms.deleteOne({ _id: req.body._id }).then((cms) => {
    if (cms) {
      return res.status(200).json({
        message: "CMS deleted successfully. Refreshing data...",
        success: true,
      });
    }
  });
});

var storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/cms_images");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var upload1 = multer({ storage: storage1 });

router.post("/cms-update", upload1.single("file"), (req, res) => {
  // const { errors, isValid } = validateCmsInput(req.body, "image");
  // if (!isValid) {
  //   return res.status(400).json(errors);
  // }
  const _id = req.body._id;
  const file = req.file;
  let update = {};
  if (file != "" && file != undefined) {
    const image = req.file.filename;
    update = {
      identifier: req.body.identifier,
      subject: req.body.subject,
      content: req.body.content,
      image: image,
    };
  } else {
    update = {
      identifier: req.body.identifier,
      subject: req.body.subject,
      content: req.body.content,
    };
  }
  console.log(update);
  /*  const _id = req.body._id;*/
  Cms.update({ _id: _id }, { $set: update }, function (err, result) {
    if (err) {
      return res.status(400).json({ message: "Unable to update cms." });
    } else {
      return res.status(200).json({
        message: "Cms updated successfully. Refreshing data...",
        success: true,
      });
    }
  });
});

router.post("/settings-get", (req, res) => {
  Settings.find({})
    .limit(1)
    .then((settings) => {
      if (settings) {
        return res.status(200).send(settings[0]);
      }
    });
});

router.get("/maintanancecheck", (req, res) => {
  Settings.find({}, { maintanancestate: 1, _id: 0 }).then((status) => {
    res.json({
      status: "success",
      data: status[0].maintanancestate,
    });
  });
});

router.post("/updateSettings", upload.single("file"), (req, res) => {
  const file = req.file; // file passed from client
  const meta = req.body; // all other values passed from the client, like name, etc..
  console.log(meta, "settings");
  const { errors, isValid } = validateUpdateSettingsInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  update = {
    contact_name: req.body.contact_name,
    forcedliq: req.body.forcedliq,
    email: req.body.email,
    mobile_number: req.body.mobile_number,
    sitename: req.body.sitename,
    site_description: req.body.site_description,
    phone_number: req.body.phone_number,
    address: req.body.address,
    reg_code: req.body.reg_code,
    company_info_link: req.body.company_info_link,
    license_info_link: req.body.license_info_link,
    google_analytics: req.body.google_analytics,
    social_link1: req.body.social_link1,
    social_link2: req.body.social_link2,
    social_link3: req.body.social_link3,
    social_link4: req.body.social_link4,
    social_link5: req.body.social_link5,
    copyright_text: req.body.copyright_text,
  };

  var liq = req.body.forcedliq == "Disable" ? "1" : "0";
  perpetual
    .updateMany(
      {},
      {
        $set: { liq_users: liq },
      }
    )
    .then((contract) => {})
    .catch((err) => console.log(err));

  if (file != "" && file != undefined) {
    const sitelogo = req.file.filename;
    update.sitelogo = req.file.filename;
  }
  console.log(update);
  const _id = req.body._id;
  console.log(_id);
  Settings.update({ _id: _id }, { $set: update }, function (err, result) {
    if (err) {
      return res.status(400).json({ message: "Unable to update settings." });
    } else {
      return res.status(200).json({
        message: "Settings updated successfully. Refreshing data...",
        success: true,
      });
    }
  });
});

//FAQ

//CMS

router.post("/faq-add", (req, res) => {
  const { errors, isValid } = validateFaqInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  console.log(req.body);
  Faq.findOne({ question: req.body.question }).then((faq) => {
    if (faq) {
      return res.status(400).json({ question: "Question already exists" });
    } else {
      const newFaq = new Faq({
        question: req.body.question,
        answer: req.body.answer,
      });
      newFaq
        .save()
        .then((faq) => {
          return res
            .status(200)
            .json({ message: "FAQ added successfully. Refreshing data..." });
        })
        .catch((err) => console.log(err));
    }
  });
});

router.post("/faq-data", (req, res) => {
  Faq.find({}).then((faq) => {
    if (faq) {
      return res.status(200).send(faq);
    }
  });
});

router.post("/faq-delete", (req, res) => {
  Faq.deleteOne({ _id: req.body._id }).then((faq) => {
    if (faq) {
      return res.status(200).json({
        message: "FAQ deleted successfully. Refreshing data...",
        success: true,
      });
    }
  });
});

router.post("/faq-update", (req, res) => {
  const { errors, isValid } = validateFaqInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const _id = req.body._id;
  let update = { question: req.body.question, answer: req.body.answer };
  Faq.update({ _id: _id }, { $set: update }, function (err, result) {
    if (err) {
      return res.status(400).json({ message: "Unable to update faq." });
    } else {
      return res.status(200).json({
        message: "FAQ updated successfully. Refreshing data...",
        success: true,
      });
    }
  });
});

//COnact us

router.post("/contact-data", (req, res) => {
  Contact.find({})
    .sort({ _id: -1 })
    .then((contact) => {
      if (contact) {
        return res.status(200).send(contact);
      }
    });
});

router.post("/contact-delete", (req, res) => {
  Contact.deleteOne({ _id: req.body._id }).then((contact) => {
    if (contact) {
      return res.status(200).json({
        message: "Contact deleted successfully. Refreshing data...",
        success: true,
      });
    }
  });
});

router.post("/chat-delete", (req, res) => {
  Chat.deleteOne({ _id: req.body._id }).then((contact) => {
    if (contact) {
      return res.status(200).json({
        message: "Chat deleted successfully. Refreshing data...",
        success: true,
      });
    }
  });
});

router.post("/replycontact", (req, res) => {
  var id = req.body._id;
  var contactemail = "";
  var message = "";
  async.waterfall(
    [
      function (done) {
        Contact.findById(id).then((contact) => {
          if (contact) {
            contactemail = contact.email;
            message = contact.message;
            done();
          }
        });
      },
      function (done) {
        var smtpConfig = {
          // service: keys.serverName,
          host: keys.host, // Amazon email SMTP hostname
          auth: {
            user: keys.email,
            pass: keys.password,
          },
        };
        var transporter = nodemailer.createTransport(smtpConfig);

        var mailOptions = {
          from: keys.fromName + "<" + keys.fromemail + ">", // sender address
          to: contactemail, // list of receivers
          subject: "Thanks for Contact us", // Subject line
          html: req.body.reply, // html body
        };
        console.log(mailOptions);
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            return console.log(error);
          } else {
            return res.status(200).json({
              message: "Reply Mail sent to user. Refreshing data...",
              success: true,
            });
          }
        });
      },
    ],
    function (err) {}
  );
});

router.post("/user-changestatus", function (req, res) {
  var pdata = req.body;
  console.log(pdata, "pdata");
  User.findOne({ _id: pdata }, { active: 1 }).then((results) => {
    // console.log(results, "results");
    try {
      if (results.active != "Activated") {
        var title = "Activated";
      } else {
        var newstatus = 1;
        var title = "DeActivated";
        // var title = "";
      }

      User.findOneAndUpdate(
        { _id: pdata },
        { $set: { active: title } },
        { new: true }
      ).exec(function (uperr, resUpdate) {
        console.log(resUpdate, "resUpdate");
        if (!uperr) {
          // console.log(resUpdate);
          res.json({
            status: true,
            message: "Page status " + title + " successfully",
          });
        } else {
          res.json({
            status: false,
            message: "Some error was occurred while updating user status",
          });
        }
      });
    } catch (err) {
      console.log(err, "err");
      res.json({
        status: false,
        message: "Some error was occurred while updating user status" + err,
      });
    }
  });
});

// router.post('/user-changestatus', function (req, res) {
//   var pdata = req.body;
//   console.log(pdata, 'pdata');
//   User.findOne({ _id: pdata }, { active: 1 }).then(results => {
//     console.log(results, 'results');
//     try {
//
//       if (results.active != "" || results.active != '0') {
//         var newstatus = 0;
//         var title = 'Deactivated'
//       }
//       else {
//         var newstatus = 1;
//
//         var title = 'Activated'
//       }
//       User.findOneAndUpdate({ "_id": pdata }, { "$set": { "active": newstatus } }, { new: true }).exec(function (uperr, resUpdate) {
//         // console.log(resUpdate,'resUpdate');
//         if (!uperr) {
//           console.log(resUpdate);
//           res.json({ 'status': true, message: "Account status " + title + " successfully" })
//         }
//         else {
//           res.json({ 'status': false, message: "Some error was occurred while updating user status" })
//         }
//       });
//     } catch (err) {
//       console.log(err, 'err');
//       res.json({ 'status': false, message: "Some error was occurred while updating user status" + err })
//     }
//
//   });
//
//
// });

router.post("/blockuser", function (req, res) {
  var pdata = req.body;
  console.log(pdata, "pdata");

  User.findOneAndUpdate(
    { _id: pdata._id },
    { $set: { blocktime: new Date(), blockhours: pdata.blocking_time } },
    { new: true }
  ).exec(function (uperr, resUpdate) {
    console.log(resUpdate, "resUpdate");
    if (!uperr) {
      console.log(resUpdate);
      res.json({ status: true, message: "Chat process blocked successfully" });
    } else {
      res.json({
        status: false,
        message: "Some error was occurred while updating user status",
      });
    }
  });
});

router.post("/addbonus", function (req, res) {
  var pdata = req.body;
  console.log(pdata, "pdata");
  updatebaldata = {};
  updatebaldata["tempcurrency"] = pdata.bonus_amount;
  Assets.findOneAndUpdate(
    { currencySymbol: "BTC", userId: ObjectId(pdata._id) },
    { $inc: updatebaldata },
    { new: true, fields: { balance: 1 } },
    function (balerr, baldata) {
      const newBonus = new Bonus({
        userId: pdata._id,
        bonus_amount: pdata.bonus_amount,
        type: "3",
      });
      newBonus.save(function (err, data) {
        // console.log(err,'err')
        // console.log(data,'data')
      });
      if (!balerr) {
        res.json({ status: true, message: "Bonus added successfully" });
      } else {
        res.json({
          status: false,
          message: "Some error was occurred while updating bonus",
        });
      }
    }
  );
});

router.post("/user-changemoderator", function (req, res) {
  var pdata = req.body;
  console.log(pdata, "pdata");
  User.findOne({ _id: pdata }, { moderator: 1 }).then((results) => {
    console.log(results, "results");
    try {
      if (results.moderator == "1") {
        var newstatus = "0";
        var title = "Deactivated";
      } else {
        var newstatus = "1";

        var title = "Activated";
      }
      User.findOneAndUpdate(
        { _id: pdata },
        { $set: { moderator: newstatus } },
        { new: true, fields: { password: 0, loginhistory: 0 } }
      ).exec(function (uperr, resUpdate) {
        console.log(resUpdate, "resUpdate");
        if (!uperr) {
          console.log(resUpdate);
          res.json({
            status: true,
            message: "Moderator status " + title + " successfully",
          });
        } else {
          res.json({
            status: false,
            message: "Some error was occurred while updating moderator status",
          });
        }
      });
    } catch (err) {
      console.log(err, "err");
      res.json({
        status: false,
        message: "Some error was occurred while updating user status" + err,
      });
    }
  });
});

router.post("/support-data", (req, res) => {
  Support.find({})
    .sort({ _id: -1 })
    .then((support_data) => {
      if (support_data) {
        return res.status(200).send(support_data);
      }
    });
});

router.post("/support-delete", (req, res) => {
  Support.deleteOne({ _id: req.body._id }).then((support_data) => {
    if (support_data) {
      return res.status(200).json({
        message: "Contact deleted successfully. Refreshing data...",
        success: true,
      });
    }
  });
});

router.post("/support-reply", (req, res) => {
  const pdata = req.body._id;
  console.log(pdata, "resssssssssssssssssssssssaaaaaaaa");
  Support.findOne({ _id: pdata.id }, {}).then((support_data) => {
    console.log(support_data, "support_data");
    if (support_data) {
      return res.status(200).send(support_data);
    }
  });
});
router.post("/support-reply_view", (req, res) => {
  const pdata = req.body._id;
  console.log(pdata, "resssssssssssssssssssssssaaaaaaaa");
  Support.findOne({ _id: pdata.id }, { reply: 1 }).then((support_data1) => {
    console.log(support_data1, "support_data1");
    if (support_data) {
      return res.status(200).send(support_data1);
    }
  });
});
var storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/support_images");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var upload2 = multer({ storage: storage2 });
//multer({ storage: storage, limits: {fileSize: 100000000} });
router.post(
  "/support_reply_admin",
  upload2.single("file"),
  function (req, res) {
    const { errors, isValid } = validateSupportReplyInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const file = req.file;
    const details = req.body;

    var attachment1 = "";

    if (file != "" && file != undefined) {
      attachment1 = req.file.filename;
    } else {
      attachment1 = null;
    } // check DB
    var reply_details = {
      message_query: details.message_query,
      replytype: "admin",
      /* "replyby"      : ObjectId(req.session.adminid_b),*/
      replydate: new Date(),
      query_image: attachment1,
    };

    Support.findOneAndUpdate(
      { _id: ObjectId(details._id) },
      { $set: { reply_status: "replied" }, $push: { reply: reply_details } },
      { new: true },
      function (err, supdata) {
        console.log(supdata, "supdata");
        if (err) {
          return res.status(400).json({ message: "some error occurred" });
        } else {
          return res
            .status(200)
            .json({ message: "Reply to the Ticket. Refreshing data..." });
        }
      }
    );
  }
);

// chat
router.post("/chat-add", (req, res) => {
  const chatMsg = new Chat({
    userId: req.body.userId,
    message: req.body.message,
  });
  chatMsg
    .save()
    .then((faq) => {
      return res.status(200).json({
        status: true,
        message: "Chat added successfully. Refreshing data...",
      });
    })
    .catch((err) => console.log(err));
});

router.get("/chat-data", (req, res) => {
  Chat.find({
    createddate: {
      $gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
    },
  })
    .populate("userId", "name email moderator ")
    .sort({ _id: -1 })
    .exec(function (err, chat) {
      if (chat) {
        return res.status(200).send(chat);
      }
    });
});

router.post("/updatedynamic", (req, res) => {
  const passdata = req.body;
  console.log("Fee data===", passdata);
  var update = passdata.update;
  // const FeetableStructure= new FeeTable({
  //     firstlevel:value.firstlevel,
  //     minamount:value.minamount
  // })
  // FeetableStructure.save()
  FeeTable.findOneAndUpdate(
    { _id: ObjectId("5e3ba5ee9ac91b5bec01a022") },
    update
  )
    .then((result) => {
      return res
        .status(200)
        .json({ status: true, message: "Fee Structure updated" });
    })
    .catch((err) => console.log(err));
});

router.post("/withdraw-data", (req, res) => {
  RequestTable.find({})
    .populate("receiveraddress")
    .populate({ path: "userId", select: "email" })
    .sort({ _id: -1 })
    .then((result) => {
      if (result) {
        resultarr = [];
        for (i = 0; i < result.length; i++) {
          var userId = result[i].userId ? result[i].userId.email : "";
          var receiveraddress = result[i].receiveraddress
            ? result[i].receiveraddress.address
            : "";
          var _id = result[i]._id ? result[i]._id : "";
          var cryptoType = result[i].cryptoType ? result[i].cryptoType : "";
          var transferamount = result[i].transferamount
            ? result[i].transferamount
            : "";
          var txid = result[i].txid ? result[i].txid : "";
          var created_date = result[i].created_date
            ? result[i].created_date
            : "";
          var status = result[i].status ? result[i].status : "";
          var data1 = new Date(created_date);
          let date =
            data1.getFullYear() +
            "-" +
            (data1.getMonth() + 1) +
            "-" +
            data1.getDate() +
            " " +
            data1.getHours() +
            ":" +
            data1.getMinutes() +
            ":" +
            data1.getSeconds();
          var transactionId = result[i].transactionId
            ? result[i].transactionId
            : "";

          resultobj = {
            _id: _id,
            userId: userId,
            cryptoType: cryptoType,
            receiveraddress: receiveraddress,
            created_date: date,
            status: status,
            transferamount: parseFloat(transferamount).toFixed(8),
            transactionId: transactionId,
          };

          resultarr.push(resultobj);
        }
        return res.status(200).send(resultarr);
      }
    });
});

router.post("/Userbalance-data", (req, res) => {
  Assets.find({})
    .populate({ path: "userId", select: "email" })
    .sort({ _id: -1 })
    .then((result) => {
      if (result) {
        resultarr = [];
        for (i = 0; i < result.length; i++) {
          if (result[i].userId != null) {
            var userId = result[i].userId ? result[i].userId.email : "";
            var tempcurrency = result[i].tempcurrency
              ? result[i].tempcurrency
              : 0;
            var currencySymbol = result[i].currencySymbol
              ? result[i].currencySymbol
              : 0;
            var balance = result[i].balance ? result[i].balance : 0;
            var spotwallet = result[i].spotwallet ? result[i].spotwallet : 0;
            resultobj = {
              userId: userId,
              currencySymbol: currencySymbol,
              tempcurrency: parseFloat(tempcurrency).toFixed(8),
              balance: parseFloat(balance).toFixed(8),
              spotwallet: parseFloat(spotwallet).toFixed(8),
            };

            resultarr.push(resultobj);
          }
        }
        return res.status(200).send(resultarr);
      }
    });
});
router.post("/deposit-data", (req, res) => {
  Transaction.find({ transferType: "TOUSER" })
    .populate({ path: "user_id", select: "email" })
    .sort({ _id: -1 })
    .then((result) => {
      if (result) {
        resultarr = [];
        for (i = 0; i < result.length; i++) {
          var user_id = result[i].user_id ? result[i].user_id.email : "";
          var toaddress = result[i].toaddress ? result[i].toaddress : "";
          var currency = result[i].currency ? result[i].currency : "";
          var amount = result[i].amount ? result[i].amount : "";
          var txid = result[i].txid ? result[i].txid : "";
          var created_date = result[i].created_date
            ? result[i].created_date
            : "";
          var status = result[i].status ? "Confirmed" : "";
          var data1 = new Date(created_date);
          let date =
            data1.getFullYear() +
            "-" +
            (data1.getMonth() + 1) +
            "-" +
            data1.getDate() +
            " " +
            data1.getHours() +
            ":" +
            data1.getMinutes() +
            ":" +
            data1.getSeconds();
          resultobj = {
            user_id: user_id,
            currency: currency,
            toaddress: toaddress,
            txid: txid,
            created_date: date,
            status: status,
            amount: parseFloat(amount).toFixed(8),
          };

          resultarr.push(resultobj);
        }
        return res.status(200).send(resultarr);
      }
    });
});

router.post("/liquidated-data", (req, res) => {
  position_table
    .find({ exit_type: "Liquidated" })
    .populate({ path: "userId", select: "email" })
    .sort({ _id: -1 })
    .then((result) => {
      if (result) {
        resultarr = [];
        for (i = 0; i < result.length; i++) {
          var user_id = result[i].userId ? result[i].userId.email : "";
          var quantity = result[i].quantity ? result[i].quantity : "";
          var pairname = result[i].pairname ? result[i].pairname : "";
          var entry_price = result[i].entry_price ? result[i].entry_price : "";
          var profitnloss = result[i].profitnloss ? result[i].profitnloss : "";
          var exit_price = result[i].exit_price ? result[i].exit_price : "";
          var createdDate = result[i].createdDate ? result[i].createdDate : "";
          var closing_direction = result[i].closing_direction
            ? result[i].closing_direction
            : "";
          var data1 = new Date(createdDate);
          let date =
            data1.getFullYear() +
            "-" +
            (data1.getMonth() + 1) +
            "-" +
            data1.getDate() +
            " " +
            data1.getHours() +
            ":" +
            data1.getMinutes() +
            ":" +
            data1.getSeconds();

          resultobj = {
            pairname: pairname,
            user_id: user_id,
            quantity: parseFloat(quantity).toFixed(8),
            entry_price: parseFloat(entry_price).toFixed(2),
            exit_price: parseFloat(exit_price).toFixed(2),
            profitnloss: parseFloat(profitnloss).toFixed(8),
            closing_direction: closing_direction,
            createdDate: date,
          };
          resultarr.push(resultobj);
        }
        return res.status(200).send(resultarr);
      }
    });
});

router.post("/updatewithdraw", (req, res) => {
  console.log(req.body, "req.body");
  var updateVal = { status: req.body.status };
  RequestTable.findByIdAndUpdate(
    { _id: ObjectId(req.body.id) },
    updateVal,
    { new: true },
    function (err, assetupdatedata) {
      if (!err) {
        return res.json({
          status: true,
          message: "Withdraw Request " + req.body.status,
        });
        if (req.body.status == "Confirmed") {
          console.log("inside if");
          RequestTable.findOne({ _id: ObjectId(req.body.id) })
            .populate("receiveraddress")
            .populate({ path: "userId", select: "email" })
            .then((assetupdatedata) => {
              // RequestTable.findOne({_id:ObjectId(req.body.id)}).populate('receiveraddress').then(err,assetupdatedata => {
              console.log(err, "err");
              console.log(assetupdatedata, "assetupdatedata");
              var currency = assetupdatedata.cryptoType;
              if (assetupdatedata) {
                if (assetupdatedata.cryptoType == "XRP") {
                  const address = keys.rippleaddress;
                  // const secret = keys.ripplesecret;
                  const secret = CryptoJS.AES.decrypt(
                    keys.ripplesecret,
                    keys.rippleSecretKey
                  ).toString(CryptoJS.enc.Utf8);

                  const payment = {
                    source: {
                      address: address,
                      maxAmount: {
                        value: assetupdatedata.transferamount.toString(),
                        currency: "XRP",
                      },
                    },
                    destination: {
                      address: assetupdatedata.receiveraddress.address,
                      tag: parseInt(assetupdatedata.receiveraddress.tagid),
                      amount: {
                        value: assetupdatedata.transferamount.toString(),
                        currency: "XRP",
                      },
                    },
                  };
                  const instructions = { maxLedgerVersionOffset: 5 };
                  api.connect().then(() => {
                    console.log("Connected...");
                    return api
                      .preparePayment(address, payment, instructions)
                      .then((prepared) => {
                        console.log("Payment transaction prepared...");
                        const { signedTransaction } = api.sign(
                          prepared.txJSON,
                          secret
                        );
                        console.log("Payment transaction signed...");
                        api.submit(signedTransaction).then((result) => {
                          console.log(result);
                          if (
                            result &&
                            typeof result.tx_json != "undefined" &&
                            typeof result.tx_json.hash != "undefined"
                          ) {
                            var updateVal = {
                              transactionId: result.tx_json.hash,
                            };
                            RequestTable.findByIdAndUpdate(
                              { _id: ObjectId(req.body.id) },
                              updateVal,
                              { new: true },
                              function (err, assetupdatedata1) {
                                var useremail = assetupdatedata.userId.email;
                                var jsonfilter = {
                                  identifier: "Withdraw_notification",
                                };
                                Emailtemplates.findOne(
                                  jsonfilter,
                                  { _id: 0 },
                                  function (err, templates) {
                                    if (templates.content) {
                                      templateData = templates;
                                      templateData.content =
                                        templateData.content.replace(
                                          /##templateInfo_name##/g,
                                          useremail
                                        );
                                      templateData.content =
                                        templateData.content.replace(
                                          /##templateInfo_appName##/g,
                                          keys.siteName
                                        );
                                      templateData.content =
                                        templateData.content.replace(
                                          /##DATE##/g,
                                          new Date()
                                        );
                                      templateData.content =
                                        templateData.content.replace(
                                          /##AMOUNT##/g,
                                          parseFloat(
                                            assetupdatedata.transferamount
                                          ).toFixed(8)
                                        );
                                      templateData.content =
                                        templateData.content.replace(
                                          /##TXID##/g,
                                          result.tx_json.hash
                                        );
                                      templateData.content =
                                        templateData.content.replace(
                                          /##CURRENCY##/g,
                                          "XRP"
                                        );
                                      var smtpConfig = {
                                        host: keys.host, // Amazon email SMTP hostname
                                        auth: {
                                          user: keys.email,
                                          pass: keys.password,
                                        },
                                      };
                                      var transporter =
                                        nodemailer.createTransport(smtpConfig);

                                      var mailOptions = {
                                        from:
                                          keys.fromName +
                                          "<" +
                                          keys.fromemail +
                                          ">", // sender address
                                        to: useremail, // list of receivers
                                        subject: templateData.subject, // Subject line
                                        html: templateData.content, // html body
                                      };
                                      transporter.sendMail(
                                        mailOptions,
                                        function (error, info) {
                                          if (error) {
                                            return console.log(error);
                                          }
                                        }
                                      );
                                    }
                                  }
                                );
                                res.json({
                                  status: true,
                                  message:
                                    "Withdraw Request " + req.body.status,
                                });
                              }
                            );
                          }
                        });
                      });
                  });
                } else if (currency == "ETH") {
                  var useraddress = keys.ethaddress;
                  var userkey = keys.ethkey;
                  console.log(useraddress, "useraddress");
                  console.log(userkey, "userkey");
                  var decrypted = CryptoJS.AES.decrypt(
                    userkey,
                    keys.cryptoPass
                  );
                  var decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
                  var userprivatekey = decryptedData.substring(2);
                  userprivatekey = userprivatekey;

                  var header = { "Content-Type": "application/json" };
                  var args = {
                    account1: assetupdatedata.receiveraddress.address,
                    cryptoPass: keys.cryptoPass,
                    adminaddress: useraddress,
                    privkey: userprivatekey,
                    amount: assetupdatedata.transferamount,
                    type: "sendtoaddress",
                  };

                  console.log(args, "args");
                  const options = {
                    url: "http://78.141.220.37:3000/ethnode",
                    method: "POST",
                    headers: header,
                    body: JSON.stringify(args),
                  };
                  rp(options).then(function (body, response, test) {
                    console.log(body, "body-->");
                    var info = JSON.parse(body);
                    if (info.status) {
                      var updateVal = { transactionId: info.txHash };
                      RequestTable.findByIdAndUpdate(
                        { _id: ObjectId(req.body.id) },
                        updateVal,
                        { new: true },
                        function (err, assetupdatedata1) {
                          var useremail = assetupdatedata.userId.email;
                          var jsonfilter = {
                            identifier: "Withdraw_notification",
                          };
                          Emailtemplates.findOne(
                            jsonfilter,
                            { _id: 0 },
                            function (err, templates) {
                              if (templates.content) {
                                templateData = templates;
                                templateData.content =
                                  templateData.content.replace(
                                    /##templateInfo_name##/g,
                                    useremail
                                  );
                                templateData.content =
                                  templateData.content.replace(
                                    /##templateInfo_appName##/g,
                                    keys.siteName
                                  );
                                templateData.content =
                                  templateData.content.replace(
                                    /##DATE##/g,
                                    new Date()
                                  );
                                templateData.content =
                                  templateData.content.replace(
                                    /##AMOUNT##/g,
                                    parseFloat(
                                      assetupdatedata.transferamount
                                    ).toFixed(8)
                                  );
                                templateData.content =
                                  templateData.content.replace(
                                    /##TXID##/g,
                                    info.txHash
                                  );
                                templateData.content =
                                  templateData.content.replace(
                                    /##CURRENCY##/g,
                                    "ETH"
                                  );
                                var smtpConfig = {
                                  host: keys.host, // Amazon email SMTP hostname
                                  auth: {
                                    user: keys.email,
                                    pass: keys.password,
                                  },
                                };
                                var transporter =
                                  nodemailer.createTransport(smtpConfig);

                                var mailOptions = {
                                  from:
                                    keys.fromName + "<" + keys.fromemail + ">", // sender address
                                  to: useremail, // list of receivers
                                  subject: templateData.subject, // Subject line
                                  html: templateData.content, // html body
                                };
                                transporter.sendMail(
                                  mailOptions,
                                  function (error, info) {
                                    if (error) {
                                      return console.log(error);
                                    }
                                  }
                                );
                              }
                            }
                          );
                          res.json({
                            status: true,
                            message: "Withdraw Request " + req.body.status,
                          });
                        }
                      );
                    } else {
                      res.json({ status: true, message: info.message });
                    }
                  });
                } else if (currency == "USDT") {
                  var useraddress = keys.ethaddress;
                  var userkey = keys.ethkey;
                  var decrypted = CryptoJS.AES.decrypt(
                    userkey,
                    keys.cryptoPass
                  );
                  var decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
                  var userprivatekey = decryptedData.substring(2);
                  userprivatekey = userprivatekey;

                  var header = { "Content-Type": "application/json" };
                  var args = {
                    account1: assetupdatedata.receiveraddress.address,
                    cryptoPass: keys.cryptoPass,
                    adminaddress: useraddress,
                    privkey: userprivatekey,
                    amount: assetupdatedata.transferamount,
                    type: "usdtsendtoaddress",
                  };

                  console.log(args, "args");
                  const options = {
                    url: "http://78.141.220.37:3000/ethnode",
                    method: "POST",
                    headers: header,
                    body: JSON.stringify(args),
                  };
                  console.log(options, "options");
                  rp(options).then(function (body, response, test) {
                    console.log(body, "body");
                    var info = JSON.parse(body);
                    if (info.status) {
                      var updateVal = { transactionId: info.txHash };
                      RequestTable.findByIdAndUpdate(
                        { _id: ObjectId(req.body.id) },
                        updateVal,
                        { new: true },
                        function (err, assetupdatedata1) {
                          var useremail = assetupdatedata.userId.email;
                          var jsonfilter = {
                            identifier: "Withdraw_notification",
                          };
                          Emailtemplates.findOne(
                            jsonfilter,
                            { _id: 0 },
                            function (err, templates) {
                              if (templates.content) {
                                templateData = templates;
                                templateData.content =
                                  templateData.content.replace(
                                    /##templateInfo_name##/g,
                                    useremail
                                  );
                                templateData.content =
                                  templateData.content.replace(
                                    /##templateInfo_appName##/g,
                                    keys.siteName
                                  );
                                templateData.content =
                                  templateData.content.replace(
                                    /##DATE##/g,
                                    new Date()
                                  );
                                templateData.content =
                                  templateData.content.replace(
                                    /##AMOUNT##/g,
                                    parseFloat(
                                      assetupdatedata.transferamount
                                    ).toFixed(8)
                                  );
                                templateData.content =
                                  templateData.content.replace(
                                    /##TXID##/g,
                                    info.txHash
                                  );
                                templateData.content =
                                  templateData.content.replace(
                                    /##CURRENCY##/g,
                                    "USDT"
                                  );
                                var smtpConfig = {
                                  host: keys.host, // Amazon email SMTP hostname
                                  auth: {
                                    user: keys.email,
                                    pass: keys.password,
                                  },
                                };
                                var transporter =
                                  nodemailer.createTransport(smtpConfig);

                                var mailOptions = {
                                  from:
                                    keys.fromName + "<" + keys.fromemail + ">", // sender address
                                  to: useremail, // list of receivers
                                  subject: templateData.subject, // Subject line
                                  html: templateData.content, // html body
                                };
                                transporter.sendMail(
                                  mailOptions,
                                  function (error, info) {
                                    if (error) {
                                      return console.log(error);
                                    }
                                  }
                                );
                              }
                            }
                          );
                          res.json({
                            status: true,
                            message: "Withdraw Request " + req.body.status,
                          });
                        }
                      );
                    }
                  });
                } else if (
                  currency == "BTC" ||
                  currency == "LTC" ||
                  currency == "BCH" ||
                  currency == "DCNTR"
                ) {
                  var header = { "Content-Type": "application/json" };
                  var withdrawamount = assetupdatedata.transferamount;
                  // if(currency == "DCNTR"){
                  //   withdrawamount = assetupdatedata.transferamount.toString()
                  // }else{
                  // withdrawamount  = assetupdatedata.transferamount
                  // }
                  console.log("withdraw", typeof withdrawamount);
                  var toaddress = assetupdatedata.receiveraddress.address;
                  var args = {
                    type: "sendtoaddress",
                    amount: withdrawamount,
                    toaddress: toaddress,
                  };

                  var url =
                    currency == "BTC"
                      ? "http://136.244.107.56:3000/btcnode"
                      : currency == "LTC"
                      ? "http://136.244.105.184:3000/ltcnode"
                      : currency == "BCH"
                      ? "http://165.227.84.53:3003/bchnode"
                      : currency == "DCNTR"
                      ? "http://54.255.189.160:3003/dcntrcnode"
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
                        var updateVal = { transactionId: info.result };
                        RequestTable.findByIdAndUpdate(
                          { _id: ObjectId(req.body.id) },
                          updateVal,
                          { new: true },
                          function (err, assetupdatedata1) {
                            var useremail = assetupdatedata.userId.email;
                            var jsonfilter = {
                              identifier: "Withdraw_notification",
                            };
                            Emailtemplates.findOne(
                              jsonfilter,
                              { _id: 0 },
                              function (err, templates) {
                                if (templates.content) {
                                  templateData = templates;
                                  templateData.content =
                                    templateData.content.replace(
                                      /##templateInfo_name##/g,
                                      useremail
                                    );
                                  templateData.content =
                                    templateData.content.replace(
                                      /##templateInfo_appName##/g,
                                      keys.siteName
                                    );
                                  templateData.content =
                                    templateData.content.replace(
                                      /##DATE##/g,
                                      new Date()
                                    );
                                  templateData.content =
                                    templateData.content.replace(
                                      /##AMOUNT##/g,
                                      parseFloat(
                                        assetupdatedata.transferamount
                                      ).toFixed(8)
                                    );
                                  templateData.content =
                                    templateData.content.replace(
                                      /##TXID##/g,
                                      info.result
                                    );
                                  templateData.content =
                                    templateData.content.replace(
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
                                  var transporter =
                                    nodemailer.createTransport(smtpConfig);

                                  var mailOptions = {
                                    from:
                                      keys.fromName +
                                      "<" +
                                      keys.fromemail +
                                      ">", // sender address
                                    to: useremail, // list of receivers
                                    subject: templateData.subject, // Subject line
                                    html: templateData.content, // html body
                                  };
                                  transporter.sendMail(
                                    mailOptions,
                                    function (error, info) {
                                      if (error) {
                                        return console.log(error);
                                      }
                                    }
                                  );
                                }
                              }
                            );
                            res.json({ status: true, result: info.result });
                          }
                        );
                      } else {
                        res.json({
                          status: false,
                          message: info.error.message,
                        });
                      }
                    } else {
                      res.json({ status: false, message: error.error.message });
                    }
                  });
                } else {
                  console.log("inside the else");
                  Currency.findOne({ currencySymbol: currency }).then(
                    (currencydata) => {
                      // console.log("currencydata",currencydata)
                      const currencycontract = currencydata.contractAddress;
                      const curminabi = currencydata.minABI;

                      var header = { "Content-Type": "application/json" };
                      var args = {
                        adminaddress: assetupdatedata.receiveraddress.address,
                        userprivkey: keys.ethkey,
                        useraddress: keys.ethaddress,
                        cryptoPass: keys.cryptoPass,
                        curminabi: curminabi,
                        curcontractaddress: currencycontract,
                        type: "tokentoadmin",
                      };
                      console.log("argsss", args);
                      const options = {
                        url: "http://78.141.220.37:3000/ethnode",
                        method: "POST",
                        headers: header,
                        body: JSON.stringify(args),
                      };
                      rp(options).then(function (body, response, test) {
                        console.log(body, "body");
                        var info = JSON.parse(body);
                        if (info.status) {
                          var updateVal = { transactionId: info.txHash };
                          RequestTable.findByIdAndUpdate(
                            { _id: ObjectId(req.body.id) },
                            updateVal,
                            { new: true },
                            function (err, assetupdatedata1) {
                              var useremail = assetupdatedata.userId.email;
                              var jsonfilter = {
                                identifier: "Withdraw_notification",
                              };
                              Emailtemplates.findOne(
                                jsonfilter,
                                { _id: 0 },
                                function (err, templates) {
                                  if (templates.content) {
                                    templateData = templates;
                                    templateData.content =
                                      templateData.content.replace(
                                        /##templateInfo_name##/g,
                                        useremail
                                      );
                                    templateData.content =
                                      templateData.content.replace(
                                        /##templateInfo_appName##/g,
                                        keys.siteName
                                      );
                                    templateData.content =
                                      templateData.content.replace(
                                        /##DATE##/g,
                                        new Date()
                                      );
                                    templateData.content =
                                      templateData.content.replace(
                                        /##AMOUNT##/g,
                                        parseFloat(
                                          assetupdatedata.transferamount
                                        ).toFixed(8)
                                      );
                                    templateData.content =
                                      templateData.content.replace(
                                        /##TXID##/g,
                                        info.txHash
                                      );
                                    templateData.content =
                                      templateData.content.replace(
                                        /##CURRENCY##/g,
                                        "ETH"
                                      );
                                    var smtpConfig = {
                                      host: keys.host, // Amazon email SMTP hostname
                                      auth: {
                                        user: keys.email,
                                        pass: keys.password,
                                      },
                                    };
                                    var transporter =
                                      nodemailer.createTransport(smtpConfig);

                                    var mailOptions = {
                                      from:
                                        keys.fromName +
                                        "<" +
                                        keys.fromemail +
                                        ">", // sender address
                                      to: useremail, // list of receivers
                                      subject: templateData.subject, // Subject line
                                      html: templateData.content, // html body
                                    };
                                    transporter.sendMail(
                                      mailOptions,
                                      function (error, info) {
                                        if (error) {
                                          return console.log(error);
                                        }
                                      }
                                    );
                                  }
                                }
                              );
                              res.json({
                                status: true,
                                message: "Withdraw Request " + req.body.status,
                              });
                            }
                          );
                        }
                      });
                    }
                  );
                }
              }
            });
        } else {
          {
            res.json({
              status: true,
              message: "Withdraw Request " + req.body.status,
            });
          }
        }
      }
    }
  );
});

router.post("/getTableDataDynamic", (req, res) => {
  var tablename = req.body.table.name;
  var returnname = req.body.return.name;
  var find = req.body.find;
  // console.log("Find in get table datadynamic", find);

  // console.log("table name", tablename);
  // console.log("returnname", returnname)
  if (tablename == "users") {
    var findtable = User;
  } else if (tablename == "FeeTable") {
    var findtable = FeeTable;
    find = {};
  }
  if (typeof find._id != "undefined") {
    find._id = ObjectId(find._id);
  }
  findtable.find(find).then((result) => {
    if (!result) {
      return res.status(404).json({
        email: "Email not found",
      });
    }
    var ret = {};
    if (returnname == "loginuserdata") {
      ret.loginuserdata = result[0];
    } else if (returnname == "referraldata") {
      ret.referraldata = result;
    } else if (returnname == "Feedata") {
      ret.Feedata = result[0];
    }
    // console.log('ret');
    // console.log(ret);
    res.json(ret);
  });
});

router.post("/stakinggethistorybyadmin", (req, res) => {
  var bodyData = req.body;
  console.log("bodyData : ", bodyData);
  stakingOrder
    .find(bodyData)
    .populate("currencyRef")
    .populate("settledList")
    .populate("userid")
    .exec(function (err, result) {
      if (result) {
        var resultarr = [];

        if (result.length == 0) {
          return res.status(200).json({
            status: true,
            data: resultarr,
          });
        } else {
          for (i = 0; i < result.length; i++) {
            console.log("new resultssss", result[i]);
            var userName = result[i].userid.name
              ? result[i].userid.name
              : result[i].userid.email;
            var currency = result[i].currencyRef.currencySymbol
              ? result[i].currencyRef.currencySymbol
              : "";
            var apy = result[i].apy ? result[i].apy : 0;
            var remainingDays =
              result[i].SettleRemainingCount + result[i].nextSettleDayCount
                ? result[i].SettleRemainingCount + result[i].nextSettleDayCount
                : "";
            var amount = result[i].amount ? result[i].amount : 0;
            var totalDays =
              result[i].type == "flexible"
                ? 365
                : result[i].type == "days"
                ? result[i].duration
                : 0;
            var type = result[i].type == "flexible" ? "Flexible" : "Locked";
            var status =
              result[i].status == 1
                ? "Process"
                : result[i].status == 2
                ? "Cancelled"
                : result[i].status == 3
                ? "Completed"
                : "";
            var settledList = result[i].settledList;
            var receivedAmt = 0;

            var status = "";

            if (result[i].status == 1) {
              status = "Process";
            } else if (result[i].status == 2) {
              status = "Cancelled";
            } else if (result[i].status == 3) {
              status = "Completed";
            } else if (result[i].status == 4) {
              status = "Completed";
            }

            var redemStatus = "";

            if (result[i].redemStatus == 1) {
              redemStatus = "";
            } else if (result[i].redemStatus == 2) {
              redemStatus = "Process";
            } else if (result[i].redemStatus == 3) {
              redemStatus = "Completed";
            }

            var newDate = new Date(result[i].createdDate);
            var date =
              newDate.getFullYear() +
              "-" +
              (newDate.getMonth() + 1) +
              "-" +
              newDate.getDate();

            for (let j = 0; j < settledList.length; j++) {
              const curElement = settledList[j];
              var setAmt = curElement.amount;
              receivedAmt = receivedAmt + setAmt;
            }
            resultobj = {
              date: date,
              userName: userName,
              currency: currency,
              apy: apy,
              amount: amount,
              status: status,
              redemStatus: redemStatus,
              remainingDays: remainingDays,
              type: type,
              totalDays: totalDays,
              receivedAmt: receivedAmt.toFixed(4),
            };
            resultarr.push(resultobj);
          }
          return res.status(200).json({
            status: true,
            data: resultarr,
          });
        }
      }
    });
});

module.exports = router;



