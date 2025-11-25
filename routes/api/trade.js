const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const async = require("async");
const validateUpdatePerpetualInput = require("../../validation/perpetual");
const validateUpdateAssetInput = require("../../validation/asset");
const validateAddCurrencyInput = require("../../validation/currency");
const User = require("../../models/User");
const Settings = require("../../models/settings");
const perpetual = require("../../models/perpetual");
const currency = require("../../models/currency");
const Emailtemplates = require("../../models/emailtemplate");
const nodemailer = require("nodemailer");
const multer = require("multer");
const Assets = require("../../models/Assets");
const tradeTable = require("../../models/tradeTable");
const Feetable = require("../../models/FeeTable");
const AssetExchange = require("../../models/AssetExchange");
const position_table = require("../../models/position_table");

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

router.get("/perpetual-data-first", (req, res) => {
  currency.find({}).then((user) => {
    if (user) {
      return res.status(200).send(user);
      console.log(user, "uesrezzzzzzz");
    }
  });
});

router.post("/asset-add", (req, res) => {
  const { errors, isValid } = validateUpdateAssetInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  console.log(req.body.pair, "pair");
  if (req.body.first_currency == req.body.second_currency) {
    return res.status(400).json({
      first_currency: "Currency pair is invalid",
    });
  } else {
    AssetExchange.findOne({
      pair: req.body.pair,
    }).then((assetexchangedata) => {
      console.log("assetExchangedata");
      if (assetexchangedata) {
        return res.status(400).json({
          second_currency: "Currency pair is already exists",
        });
      } else {
        console.log("req.body========", req.body);
        const newassetexchange = new AssetExchange({
          pair: req.body.pair,
          from_currency: req.body.first_currency,
          to_currency: req.body.second_currency,
          single_min_limit: req.body.single_min_limit,
          single_max_limit: req.body.single_max_limit,
          full_min_limit: req.body.full_min_limit,
          full_max_limit: req.body.full_max_limit,
          trade_fee: req.body.trade_fee,
          status: req.body.status,
        });
        newassetexchange
          .save()
          .then((asset) => {
            return res.status(200).json({
              message: "Asset exchange added successfully. Refreshing data...",
            });
          })
          .catch((err) => console.log(err));
      }
    });
  }
});

router.post("/asset-update", (req, res) => {
  console.log("Inside post update asset");
  console.log(req.body);
  const currency_val = req.body.pair;
  console.log(currency_val, "currency_val");
  const { errors, isValid } = validateUpdateAssetInput(req.body);
  if (!isValid) {
    console.log("Error in validdd");
    return res.status(400).json(errors);
  }
  const newassetexchange = {
    pair: req.body.pair,
    from_currency: req.body.first_currency,
    to_currency: req.body.second_currency,
    single_min_limit: req.body.single_min_limit,
    single_max_limit: req.body.single_max_limit,
    full_min_limit: req.body.full_min_limit,
    full_max_limit: req.body.full_max_limit,
    trade_fee: req.body.trade_fee,
    status: req.body.status,
  };

  if (req.body.first_currency == req.body.second_currency) {
    return res.status(400).json({
      first_currency: "Currency pair is invalid",
    });
  } else {
    AssetExchange.update(
      {
        _id: req.body._id,
      },
      {
        $set: newassetexchange,
      }
    )
      .then((contract) => {
        console.log(contract, "contractwertyui");
        return res.status(200).json({
          message: "Asset Exchange updated uccessfully. Refreshing data...",
          success: true,
        });
      })
      .catch((err) => console.log(err));
  }
});

router.post("/perpetual-add", (req, res) => {
  const { errors, isValid } = validateUpdatePerpetualInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  console.log(req.body.tickerroot, "tickerroot");
  if (req.body.first_currency == req.body.second_currency) {
    return res.status(400).json({
      first_currency: "Currency pair is invalid",
    });
  } else {
    perpetual
      .findOne({
        tiker_root: req.body.tickerroot,
      })
      .then((currencydata2) => {
        console.log(currencydata2, "currencydataaaaaaaaaaaaazzzzz");
        if (currencydata2) {
          return res.status(400).json({
            second_currency: "Currency pair is already exists",
          });
        } else {
          const newcontract = new perpetual({
            tiker_root: req.body.tickerroot,
            initial_margin: req.body.initial_margin,
            maint_margin: req.body.maint_margin,
            interest_base_symbol: req.body.interest_base_symbol,
            interest_quote_symbol: req.body.interest_quote_symbol,
            funding_premium_symbol: req.body.funding_premium_symbol,
            risk_limit: req.body.risk_limit,
            risk_step: req.body.risk_step,
            minpriceincrement: req.body.minpriceincrement,
            maxpriceincrement: req.body.maxpriceincrement,
            contract_size: req.body.contract_size,
            maxquantity: req.body.maxquantity,
            minquantity: req.body.minquantity,
            lotsize: req.body.lotsize,
            funding_interval: req.body.funding_interval,
            mark_price: req.body.mark_price,
            second_currency: req.body.second_currency,
            first_currency: req.body.first_currency,
            leverage: req.body.leverage,
            maker_rebate: req.body.maker_rebate,
            dailyinterest: req.body.dailyinterest,
            taker_fees: req.body.taker_fees,
          });

          newcontract
            .save()
            .then((contract) => {
              return res.status(200).json({
                message: "Contract added successfully. Refreshing data...",
              });
            })
            .catch((err) => console.log(err));
        }
      });
  }
});

router.post("/perpetual-update", (req, res) => {
  console.log(req.body);
  const hidd_val = req.body.hidden;
  console.log(hidd_val, "hidd_val");
  const currency_val = req.body.tickerroot;
  console.log(currency_val, "currency_val");
  const { errors, isValid } = validateUpdatePerpetualInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }
  const newcontract = {
    tiker_root: req.body.tickerroot,
    initial_margin: req.body.initial_margin,
    maint_margin: req.body.maint_margin,
    interest_base_symbol: req.body.interest_base_symbol,
    interest_quote_symbol: req.body.interest_quote_symbol,
    funding_premium_symbol: req.body.funding_premium_symbol,
    risk_limit: req.body.risk_limit,
    risk_step: req.body.risk_step,
    minpriceincrement: req.body.minpriceincrement,
    maxpriceincrement: req.body.maxpriceincrement,
    contract_size: req.body.contract_size,
    maxquantity: req.body.maxquantity,
    minquantity: req.body.minquantity,
    lotsize: req.body.lotsize,
    mark_price: req.body.mark_price,
    funding_interval: req.body.funding_interval,
    second_currency: req.body.second_currency,
    first_currency: req.body.first_currency,
    leverage: req.body.leverage,
    maker_rebate: req.body.maker_rebate,
    dailyinterest: req.body.dailyinterest,
    taker_fees: req.body.taker_fees,
  };
  if (req.body.first_currency == req.body.second_currency) {
    return res.status(400).json({
      first_currency: "Currency pair is invalid",
    });
  } else {
    perpetual
      .update(
        {
          _id: req.body._id,
        },
        {
          $set: newcontract,
        }
      )
      .then((contract) => {
        console.log(contract, "contractwertyui");
        return res.status(200).json({
          message: "Contract updated uccessfully. Refreshing data...",
          success: true,
        });
      })
      .catch((err) => console.log(err));
  }
});

router.post("/perpetual-delete", (req, res) => {
  perpetual
    .deleteOne({
      _id: req.body._id,
    })
    .then((faq) => {
      if (faq) {
        return res.status(200).json({
          message: "Contract deleted successfully. Refreshing data...",
          success: true,
        });
      }
    });
});

router.post("/changepassword", (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body, "password");
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const id = req.body._id;
  User.findById(id).then((user) => {
    bcrypt.compare(req.body.oldpassword, user.password).then((isMatch) => {
      if (isMatch) {
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(req.body.password, salt, (err, hash) => {
            if (err) throw err;
            let update = {
              password: hash,
            };
            User.update(
              {
                _id: req.body._id,
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
                    message:
                      "Password updated successfully. Refreshing data...",
                    success: true,
                  });
                }
              }
            );
          });
        });
      } else {
        return res.status(400).json({
          oldpassword: "Old password is wrong.",
        });
      }
    });
  });
});

router.post("/asset-data/", (req, res) => {
  AssetExchange.find({}).then((result) => {
    if (result) {
      return res.status(200).json({
        status: true,
        data: result,
      });
    }
  });
});

router.post("/perpetual-data/", (req, res) => {
  perpetual.find({}).then((result) => {
    if (result) {
      return res.status(200).json({
        status: true,
        data: result,
      });
    }
  });
});

router.post("/currency", (req, res) => {
  currency.find({}).then((result) => {
    if (result) {
      return res.status(200).send(result);
    }
  });
});
var storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/currency");
  },
  filename: function (req, file, cb) {
    var currency = req.body.currencySymbol;

    cb(null, currency + "-" + file.originalname);
  },
});

var upload2 = multer({ storage: storage2 });

router.post("/currency_add", upload2.single("file"), function (req, res) {
  const { errors, isValid } = validateAddCurrencyInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  console.log("req.dile",req.file)
  const file = req.file;
  var minabi = "";
  var contractaddress = "";
  var type = "";
  var currency1 = req.body.currencyName;
  var currency2 = req.body.currencySymbol;
  type = req.body.currencyType;
  minabi = JSON.stringify(req.body.minabi);
  contractaddress = req.body.contractaddress;

  var attachment1 = "";

  if (file != "" && file != undefined) {
    attachment1 = req.file.filename;
  } else {
    attachment1 = null;
  } // check DB
  currency
    .findOne({
      currencyName: req.body.currencyName,
    })
    .then((currencydata2) => {
      // console.log(currencydata2, 'currencydataaaaaaaaaaaaazzzzz');
      if (currencydata2) {
        return res.status(400).json({
          currencyName: "Currency already exists",
        });
      } else {
        currency
          .findOne({
            currencySymbol: req.body.currencySymbol,
          })
          .then((currencydata) => {
            if (currencydata) {
              return res.status(400).json({
                currencySymbol: "Currency Symbol already exists",
              });
            } else {
              const newCurrency = new currency({
                currencyName: req.body.currencyName,
                currencySymbol: req.body.currencySymbol,
                fee: req.body.fee,
                minimum: req.body.minimum,
                decimals:req.body.decimals,
                minABI: minabi,
                type: type,
                contractAddress: contractaddress,
                currencyimage: attachment1,
              });
              newCurrency
                .save()
                .then((currency) => {
                  currency_data(currency);
                  return res.status(200).json({
                    message: "Currency added successfully. Refreshing data...",
                  });
                })
                .catch((err) => console.log(err));
            }
          });
      }
    });
});
// router.post("/currency_update", (req, res) => {
router.post("/currency_update", upload2.single("file"), function (req, res) {
  console.log("inside",req.body.contractaddress);
  const { errors, isValid } = validateAddCurrencyInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const file = req.file;
  var attachment1 = "";
  console.log("req.dile",req.file)

  if (file != "" && file != undefined) {
    attachment1 = req.file.filename;
  } else {
    attachment1 = null;
  } // check DB
  var minabi = "";
  var contractaddress = "";
  var type = "";

  type = req.body.currencyType;
  minabi = JSON.stringify(req.body.minabi
  );
  contractaddress = req.body.contractaddress;
  const _id = req.body._id;
  const hidden_value = req.body.hidden;
  const hidden_value_name = req.body.hidden1;
  const curr_val = req.body.currencySymbol;
  const curr_val_name = req.body.currencyName;
  const decimals=req.body.decimals
  // console.log(req.body, "aiyyyyyyyyyyyyoooooovathuruma");
// console.log("hidenn ",hidden_value);
// console.log("hidden1",hidden_value_name);
// console.log("curvaluee",curr_val);
  let update = {
    currencyName: req.body.currencyName,
    currencySymbol: req.body.currencySymbol,
    fee: req.body.fee,
    minimum: req.body.minimum,
    minABI: minabi,
    type: type,
    decimals:decimals,
    contractAddress: contractaddress,
    currencyimage :attachment1
  };
  // console.log("updatee",update)
  if (hidden_value == curr_val) {
    currency.update(
      {
        _id: _id,
      },
      {
        $set: update,
      },
      function (err, result) {
        console.log("errer",err);
        if (result) {
          return res.status(200).json({
            message: "Currency updated successfully. Refreshing data...",
            success: true,
          });
        } else {
          if (hidden_value_name == curr_val_name) {
            currency.update(
              {
                _id: _id,
              },
              {
                $set: update,
              },
              function (err, result) {
                if (err) {
                  return res.status(400).json({
                    message: "Unable to update Currency.",
                  });
                } else {
                  return res.status(200).json({
                    message:
                      "Currency updated successfully. Refreshing data...",
                    success: true,
                  });
                }
              }
            );
          }
        }
      }
    );
  } else {
    currency
      .findOne({
        currencyName: req.body.currencyName,
      })
      .then((currencydata) => {
        console.log(currencydata, "currencydata");
        if (currencydata) {
          return res.status(400).json({
            currencyName: "Currency Name already exists",
          });
        } else {
          currency
            .findOne({
              currencySymbol: req.body.currencySymbol,
            })
            .then((currencydata1) => {
              if (currencydata1) {
                return res.status(400).json({
                  currencySymbol: "Currency Symbol already exists",
                });
              } else {
                currency.update(
                  {
                    _id: _id,
                  },
                  {
                    $set: update,
                  },
                  function (err, result) {
                    if (err) {
                      return res.status(400).json({
                        message: "Unable to update Currency.",
                      });
                    } else {
                      return res.status(200).json({
                        message:
                          "Currency updated successfully. Refreshing data...",
                        success: true,
                      });
                    }
                  }
                );
              }
            });
        }
      });
  }
});
// router.post("/currency_add", (req, res) => {
//   const { errors, isValid } = validateAddCurrencyInput(req.body);
//   if (!isValid) {
//     return res.status(400).json(errors);
//   }
//   // console.log(req.body, "bodissssssssssssss");
//   var minabi = "";
//   var contractaddress = "";
//   var type = "";
//   var currency1 = req.body.currencyName;
//   var currency2 = req.body.currencySymbol;
//   type = req.body.currencyType;
//   minabi = JSON.stringify(req.body.minabi);
//   contractaddress = req.body.contractaddress;
//   // console.log(currency2, 'currency2');
//   currency
//     .findOne({
//       currencyName: req.body.currencyName,
//     })
//     .then((currencydata2) => {
//       // console.log(currencydata2, 'currencydataaaaaaaaaaaaazzzzz');
//       if (currencydata2) {
//         return res.status(400).json({
//           currencyName: "Currency already exists",
//         });
//       } else {
//         currency
//           .findOne({
//             currencySymbol: req.body.currencySymbol,
//           })
//           .then((currencydata) => {
//             if (currencydata) {
//               return res.status(400).json({
//                 currencySymbol: "Currency Symbol already exists",
//               });
//             } else {
//               const newCurrency = new currency({
//                 currencyName: req.body.currencyName,
//                 currencySymbol: req.body.currencySymbol,
//                 fee: req.body.fee,
//                 minimum: req.body.minimum,
//                 minABI: minabi,
//                 type:type,
//                 contractAddress: contractaddress,
//               });
//               newCurrency
//                 .save()
//                 .then((currency) => {
//                   currency_data(currency);
//                   return res.status(200).json({
//                     message: "Currency added successfully. Refreshing data...",
//                   });
//                 })
//                 .catch((err) => console.log(err));
//             }
//           });
//       }
//     });
// });

router.post("/currency-delete", (req, res) => {
  console.log(req.body, "resssss");
  var id = req.body._id;
  currency
    .deleteOne({
      _id: req.body._id,
    })
    .then((currencydata) => {
      if (currencydata) {
        console.log(id, "idsssssssssss");
        delete_assets(id);
        return res.status(200).json({
          message: "Currency deleted successfully. Refreshing data...",
        });
      }
    });
});
//
// router.post("/currency_update", (req, res) => {
//   const { errors, isValid } = validateAddCurrencyInput(req.body);
//   if (!isValid) {
//     return res.status(400).json(errors);
//   }
//   var minabi = "";
//   var contractaddress = "";
//   var type = "";
//   type = req.body.currencyType;
//   minabi = JSON.stringify(req.body.minabi);
//   contractaddress = req.body.contractaddress;
//   const _id = req.body._id;
//   const hidden_value = req.body.hidden;
//   const hidden_value_name = req.body.hidden1;
//   const curr_val = req.body.currencySymbol;
//   const curr_val_name = req.body.currencyName;
//   console.log(req.body, "aiyyyyyyyyyyyyoooooovathuruma");
//   let update = {
//     currencyName: req.body.currencyName,
//     currencySymbol: req.body.currencySymbol,
//     fee: req.body.fee,
//     minimum: req.body.minimum,
//     minABI: minabi,
//     type:type,
//     contractAddress: contractaddress,
//   };
//   if (hidden_value == curr_val) {
//     currency.update(
//       {
//         _id: _id,
//       },
//       {
//         $set: update,
//       },
//       function (err, result) {
//         if (result) {
//           return res.status(200).json({
//             message: "Currnecy updated successfully. Refreshing data...",
//             success: true,
//           });
//         } else {
//           if (hidden_value_name == curr_val_name) {
//             currency.update(
//               {
//                 _id: _id,
//               },
//               {
//                 $set: update,
//               },
//               function (err, result) {
//                 if (err) {
//                   return res.status(400).json({
//                     message: "Unable to update Currency.",
//                   });
//                 } else {
//                   return res.status(200).json({
//                     message:
//                       "Currnecy updated successfully. Refreshing data...",
//                     success: true,
//                   });
//                 }
//               }
//             );
//           }
//         }
//       }
//     );
//   } else {
//     currency
//       .findOne({
//         currencyName: req.body.currencyName,
//       })
//       .then((currencydata) => {
//         console.log(currencydata, "currencydata");
//         if (currencydata) {
//           return res.status(400).json({
//             currencyName: "Currency Name already exists",
//           });
//         } else {
//           currency
//             .findOne({
//               currencySymbol: req.body.currencySymbol,
//             })
//             .then((currencydata1) => {
//               if (currencydata1) {
//                 return res.status(400).json({
//                   currencySymbol: "Currency Symbol already exists",
//                 });
//               } else {
//                 currency.update(
//                   {
//                     _id: _id,
//                   },
//                   {
//                     $set: update,
//                   },
//                   function (err, result) {
//                     if (err) {
//                       return res.status(400).json({
//                         message: "Unable to update Currency.",
//                       });
//                     } else {
//                       return res.status(200).json({
//                         message:
//                           "Currency updated successfully. Refreshing data...",
//                         success: true,
//                       });
//                     }
//                   }
//                 );
//               }
//             });
//         }
//       });
//   }
// });

function currency_data(currency) {
  User.find({}, function (err, userdetails) {
    if (userdetails) {
      userdetails.forEach(function (res) {
        var userId = res._id;
        var insertobj = {
          balance: 0,
          currency: currency._id,
          currencySymbol: currency.currencySymbol,
        };

        const newContact = new Assets({
          balance: 0,
          currency: currency._id,
          currencySymbol: currency.currencySymbol,
          userId: userId,
        });
        // console.log(newContact, "newContact");
        newContact.save(function (err, data) {
          console.log("success");
        });
      });
    }
  });
}

function delete_assets(id) {
  Assets.deleteMany({
    currency: id,
  }).then((currencydata) => {
    console.log(currencydata, "currency ideaaaaaaaaaaaa");
    if (currencydata) {
      console.log("successfully");
    }
  });
}

function referralfee(amount, currency) {
  async.waterfall(
    [
      function (done) {
        if (currency === BTC) {
          Feetable.find({}, function (err, feedetails) {
            if (err) {
              console.log("Errrorrrrr", err);
            }
            console.log("Fee Details", feedetails);
            feeamount = feedetails.minamount;
            discount = feedetails.firstlevel;
            done();
          });
        } else {
          console.log("The Bonus is only for BTC deposits");
          done();
        }
      },
      function (done) {
        if (amount >= feeamount) {
          perpetual.findOne(
            {
              first_currency: "BTC",
            },
            function (err, result) {
              if (err) {
                console.log("Error in finding currency", err);
              }
              console.log("Dataa from perpetual table", result);
              markprice = result.markprice;
              console.log("Markprice==", markprice);
              done();
            }
          );
        } else {
          console.log(
            "The deposited amount is low for the discount,Please deposit more for the discount"
          );
          done();
        }
      },
      function (done) {
        temp_balance = feeamount / markprice;
        console.log("bonus money to add", temp_balance);
        User.findOne(
          {
            _id: _id,
          },
          function (err, userdetails) {
            if (err) {
              console.log("No referrals found");
              done();
            }
            referral_id = userdetails.referaluserid;
            Assets.findOneAndUpdate(
              {
                userId: referral_id,
              },
              {
                $inc: {
                  tempcurrency: temp_balance,
                },
              },
              {
                new: true,
              },
              function (err, response) {
                if (err) {
                  console.log("Error", error);
                  done();
                }
                console.log("updated Temp balance", response);
              }
            );
          }
        );
      },
    ],
    function (err) {}
  );
  return res.status(200).json({
    message: "Temp Balance updated",
  });
}


router.get("/trade_history/", (req, res) => {
  console.log("req.query.",req.query)
  var perPage     = req.query.page_size?req.query.page_size:10
  var page        = req.query.page_number?req.query.page_number:1
  var skippage    = (perPage * page) - perPage;
  var search      = req.query.filter_value;
  var sort_column = req.query.sort_column;
  var sort_order  = req.query.sort_order;
  var sortprocess = {};
  if(typeof sort_column !== 'undefined' && sort_column && sort_column !== '' && typeof sort_order !== 'undefined' && sort_order && sort_order !== ''){
    sortprocess[sort_column] = sort_order=='asc'?1:-1;
  }
  else
  {
    sortprocess['_id'] = -1;
  }

  if (typeof search !== 'undefined' && search && search !== '') {
    filter = {
      $or: [
        {"user.email" : new RegExp(search, "i")},
        {createdDate  : {'$regex': search}},
        {quantity     : {'$regex': search}},
        {pairName     : new RegExp(search, "i")},
        {price        : {'$regex': search}},
        {orderType    : new RegExp(search, "i")},
        {_id          : {'$regex': search}},
      ]
    }
  } else {
    filter = {}
  }

  var skippage = (perPage * page) - perPage;
  tradeTable.aggregate([
      {
          "$lookup": {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user"
          }
      },
      {$unwind: "$user"},
      {$match: filter},
      {$project:{
            quantity:"$quantity",
            email:"$user.email",
            filled:"$filled",
            price:"$price",
            orderValue:"$orderValue",
            filledAmount:"$filledAmount",
            orderType:"$orderType",
            buyorsell:"$buyorsell",
          }}
  ]).sort(sortprocess).skip(skippage).limit(parseInt(perPage)).exec(function (txerr, result) {

      tradeTable.aggregate([
          {
              "$lookup": {
                  from: "users",
                  localField: "userId",
                  foreignField: "_id",
                  as: "user"
              }
          },
          {$unwind: "$user"},
          {$match: filter},
          {$project:{
            quantity:"$quantity",
            email:"$user.email",
          }}
      ]).exec(function (err, count) {
          if (err) {
              console.log(
                  err
              )
              res.status(500).json({status: false, message: 'Internal Server Error'});
          } else {
            // console.log(result)
            if (result) {
        resultarr = [];
        for (i = 0; i < result.length; i++) {
          // console.log(result[i]._id)
          var quantity = result[i].quantity ? result[i].quantity : 0;
          // var name = result[i].email
          //   ? result[i].email.split("@")[0]
          //     ? result[i].email.split("@")[0]
          //     : 0
          //   : "";
          var name = result[i].email? result[i].email: "";
          var price = result[i].price ? result[i].price : 0;
          var orderValue = result[i].orderValue ? result[i].orderValue : 0;
          var orderType = result[i].orderType ? result[i].orderType : 0;
          var _id = result[i]._id ? result[i]._id : 0;
          var classs = result[i].buyorsell == "buy" ? "greenText" : "pinkText";
          var filledAmount = result[i].filledAmount
            ? result[i].filledAmount
            : 0;
          var Remaining = parseFloat(quantity) - parseFloat(filledAmount);
          for (j = 0; j < result[i].filled.length; j++) {
            var created_at = result[i].filled[j].created_at
              ? result[i].filled[j].created_at
              : "";
            var Price = result[i].filled[j].Price
              ? result[i].filled[j].Price
              : 0;
            var pairname = result[i].filled[j].pairname
              ? result[i].filled[j].pairname
              : 0;
            var data1 = new Date(created_at);
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
              name: name,
              filledtype: "Trade",
              filledAmount: parseFloat(filledAmount).toFixed(8),
              Price: parseFloat(Price).toFixed(2),
              orderValue: parseFloat(orderValue).toFixed(2),
              Remaining: parseFloat(Remaining).toFixed(8),
              orderType: orderType,
              _id: _id,
              createdDate: date,
            };
            resultarr.push(resultobj);
          }
        }

        return res.status(200).json({
          status: true,
          result: resultarr,
          page: page,
          pages: parseInt(count.length / perPage),
          totalcount:count.length
        });
      }
          }
      });
  });
});

router.post("/trade_history/", (req, res) => {
  tradeTable
    .find({
      status: 1,
    })
    .populate("userId", "email")
    .sort({ _id: -1 })
    .then((result) => {
      if (result) {
        resultarr = [];
        for (i = 0; i < result.length; i++) {
          // console.log(result[i]._id)
          var quantity = result[i].quantity ? result[i].quantity : 0;
          var name = result[i].userId
            ? result[i].userId.email.split("@")[0]
              ? result[i].userId.email.split("@")[0]
              : 0
            : "";
          var price = result[i].price ? result[i].price : 0;
          var orderValue = result[i].orderValue ? result[i].orderValue : 0;
          var orderType = result[i].orderType ? result[i].orderType : 0;
          var _id = result[i]._id ? result[i]._id : 0;
          var classs = result[i].buyorsell == "buy" ? "greenText" : "pinkText";
          var filledAmount = result[i].filledAmount
            ? result[i].filledAmount
            : 0;
          var Remaining = parseFloat(quantity) - parseFloat(filledAmount);
          for (j = 0; j < result[i].filled.length; j++) {
            var created_at = result[i].filled[j].created_at
              ? result[i].filled[j].created_at
              : "";
            var Price = result[i].filled[j].Price
              ? result[i].filled[j].Price
              : 0;
            var pairname = result[i].filled[j].pairname
              ? result[i].filled[j].pairname
              : 0;
            var data1 = new Date(created_at);
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
              name: name,
              filledtype: "Trade",
              filledAmount: parseFloat(filledAmount).toFixed(8),
              Price: parseFloat(Price).toFixed(2),
              orderValue: parseFloat(orderValue).toFixed(2),
              Remaining: parseFloat(Remaining).toFixed(8),
              orderType: orderType,
              _id: _id,
              date: date,
            };
            resultarr.push(resultobj);
          }
        }

        return res.status(200).json({
          status: true,
          data: resultarr,
        });
      }
    });
});

router.post("/closed_history/", (req, res) => {
  position_table
    .find({})
    .populate({ path: "userId", select: "email" })
    .sort({ _id: -1 })
    .then((result) => {
      if (result) {
        var resultarr = [];
        for (i = 0; i < result.length; i++) {
          var user_id = result[i].userId ? result[i].userId.email : "";
          var quantity = result[i].quantity ? result[i].quantity : 0;
          var pairname = result[i].pairname ? result[i].pairname : "";
          var entry_price = result[i].entry_price ? result[i].entry_price : "";
          var profitnloss = result[i].profitnloss ? result[i].profitnloss : 0;
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
          if (quantity != 0) {
            resultobj = {
              pairname: pairname,
              user_id: user_id,
              quantity: parseFloat(quantity).toFixed(8),
              entry_price: parseFloat(entry_price).toFixed(2),
              exit_price: parseFloat(exit_price).toFixed(2),
              profitnloss:
                profitnloss != 0 ? parseFloat(profitnloss).toFixed(8) : "0",
              closing_direction: closing_direction,
              createdDate: date,
            };
            resultarr.push(resultobj);
          }
        }

        return res.status(200).json({
          status: true,
          data: resultarr,
        });
      }
    });
});

router.post("/order_history/", (req, res) => {
  tradeTable
    .find({})
    .populate("userId", "email")
    .sort({ _id: -1 })
    .then((result) => {
      if (result) {
        resultarr = [];
        for (i = 0; i < result.length; i++) {
          var pairName = result[i].pairName ? result[i].pairName : "";
          var quantity = result[i].quantity ? result[i].quantity : 0;
          var name = result[i].userId.email.split("@")[0]
            ? result[i].userId.email.split("@")[0]
            : 0;
          var price = result[i].quantity ? result[i].price : 0;
          var orderValue = result[i].orderValue ? result[i].orderValue : 0;
          var orderType = result[i].orderType ? result[i].orderType : 0;
          var orderDate = result[i].orderDate ? result[i].orderDate : 0;
          var classs = result[i].buyorsell == "buy" ? "greenText" : "pinkText";
          var _id = result[i]._id ? result[i]._id : 0;
          var status1 = result[i].status;
          var e_price =
            result[i].filled.length > 0 ? result[i].filled[0].Price : 0;
          var filledAmount = result[i].filledAmount
            ? result[i].filledAmount
            : 0;
          var Remaining = parseFloat(quantity) - parseFloat(filledAmount);
          var data1 = new Date(orderDate);
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

          var status =
            result[i].status == 0
              ? "New"
              : result[i].status == 1
              ? "Completed"
              : result[i].status == 2
              ? "Partial"
              : result[i].status == 3
              ? "Cancel"
              : "";

          resultobj = {
            pairName: pairName,
            name: name,
            filledAmount: parseFloat(filledAmount).toFixed(8),
            price: parseFloat(price).toFixed(2),
            orderValue: parseFloat(orderValue).toFixed(2),
            Remaining: parseFloat(Remaining).toFixed(8),
            quantity: parseFloat(quantity).toFixed(8),
            orderType: orderType,
            _id: _id,
            date: date,
            e_price: e_price,
            status: status,
          };
          resultarr.push(resultobj);
        }
        return res.status(200).json({
          status: true,
          data: resultarr,
        });
      }
    });
});

module.exports = router;
