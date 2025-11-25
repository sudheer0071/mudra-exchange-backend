const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const keys = require('../../config/keys');
const async = require("async");
const validateUpdatepairInput = require('../../validation/pair');
const validateUpdateAssetInput = require('../../validation/asset');
const validateAddCurrencyInput = require('../../validation/currency');
const validateAddStakingInput = require('../../validation/staking');
const validateAddLaunchcontactInput= require('../../validation/launchpadcontact');
const stakingOrder = require('../../models/stakingOrder');
const User = require('../../models/User');
const Settings = require('../../models/settings');
const perpetual = require('../../models/perpetual');
const spotpairs = require('../../models/spotpairs');
const SpotPairs = require('../../models/spotpairs');
const currency = require('../../models/currency');
const Emailtemplates = require('../../models/emailtemplate');
const nodemailer = require('nodemailer');
const multer = require('multer');
const Assets = require('../../models/Assets');
const tradeTable = require('../../models/tradeTable');
const Feetable = require('../../models/FeeTable')
const charts = require('../../models/Chart')
const AssetExchange = require('../../models/AssetExchange');
const position_table = require('../../models/position_table');
const spottradeTable = require('../../models/spottradeTable');
const stakingSettleList = require('../../models/stakingSettleList');
const staking = require('../../models/staking');
const LaunchpadContactus = require('../../models/LaunchpadContactus');

const { initialChartSymbol } = require('../symbols_database');
const userinfo = [];
const ObjectId = mongoose.Types.ObjectId;
var cron = require("node-cron");
const moment = require('moment');
var each = require('sync-each');

router.get('/test', (req, res) => {
  res.json({
    statue: "success"
  });
});


router.get('/asset-data-first', (req, res) => {
  currency.find({}).then(user => {
    if (user) {
      return res.status(200).send(user);
      console.log(user, 'uesrezzzzzzz');
    }
  });
})
router.post("/stakinggethistory", (req, res) => {
  var findData = req.body;
  if (typeof findData.currencyRef != 'undefined') {
    findData.currencyRef = ObjectId(findData.currencyRef);
  }

  if (typeof findData.startDate != 'undefined' || typeof findData.endDate != 'undefined') {
    var startDate = findData.startDate;
    var endDate = findData.endDate;
    if (findData.startDate != '' || findData.endDate != '') {
      findData.createdDate = {};
    }
    delete findData.startDate;
    delete findData.endDate;
  }

  if (typeof findData.createdDate != 'undefined') {
    findData.createdDate['$gte'] = new Date(startDate);
    findData.createdDate['$lte'] = new Date(endDate);
  }

  console.log('findData : ', findData);
  var userID = findData.userid;
  console.log("userdata", userID)
  stakingOrder.find(findData)
    .populate('currencyRef')
    .populate('settledList')
    .exec(function (err, record) {
      console.log("err", err)
      console.log("record", record)

      if (record) {
        var retJsonObj = {};
        retJsonObj.target = 'stakinggethistory';
        retJsonObj.record = record;
        return res.json(retJsonObj);
      }
    });
});

router.post("/Launchpad_Contactus",(req,res)=>{
  var bodyData=req.body;
    const {
    errors,
    isValid
  } = validateAddLaunchcontactInput(bodyData);
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const newcontract = new LaunchpadContactus({
          name: bodyData.name,
          project:bodyData.project,
          email:bodyData.email
        });
    var retJsonObj = {};
  newcontract.save().then(result => {
        retJsonObj.retMsg = 'Launchpad Contactus added successfully';
        retJsonObj.retType = 'success';
        return res.json(retJsonObj);
          }).catch(err => console.log(err));
})

router.post("/stackingClose", (req, res) => {
  var retJsonObj = {};
  retJsonObj.target = 'stackingClose';
  var bodyData = req.body;
  console.log('bodyData : ', bodyData);
  var findData = {};
  findData._id = bodyData._id;
  stakingOrder.findOne(findData)
    .populate('currencyRef')
    .populate('settledList', 'createdDate')
    .exec(function (err, items) {
      if (err) {
        retJsonObj.err = err;
        retJsonObj.retMsg = 'Error occured.';
        retJsonObj.retType = 'danger';
        return res.json(retJsonObj);
      } else if (items == null) {
        retJsonObj.retMsg = 'Record not found.';
        retJsonObj.retType = 'danger';
        return res.json(retJsonObj);
      } else if (items) {
        var status = items.status;

        if (status == 2) {
          retJsonObj.retMsg = 'Staking already closed.';
          retJsonObj.retType = 'danger';
          return res.json(retJsonObj);
        } else if (status == 3) {
          retJsonObj.retMsg = 'Staking already completed.';
          retJsonObj.retType = 'danger';
          return res.json(retJsonObj);
        }

        retJsonObj.items = items;

        var settledList = items.settledList;
        var SettleRemainingCount = items.SettleRemainingCount;
        var nextSettleDayCount = items.nextSettleDayCount;

        if (settledList.length == 0) {
          var startDate = items.createdDate;
        } else {
          var startDate = settledList[settledList.length - 1].createdDate;
        }

        var endDate = new Date();
        var d = new Date();

        const date1 = new Date(startDate);
        const date2 = new Date(endDate);
        const diffTime = Math.abs(date2 - date1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        var seconds = Math.floor((date2 - (date1)) / 1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);
        var days = Math.floor(hours / 24);

        hours = hours - (days * 24);
        minutes = minutes - (days * 24 * 60) - (hours * 60);
        seconds = seconds - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);
        console.log(hours + ' - ' + minutes + ' - ' + seconds + ' - ' + days);

        var amount = items.amount;
        var apy = items.apy;

        var fullSettleAmt = (amount * apy) / 100;
        var daySettleAmt = fullSettleAmt / 365;
        var settleAmt = daySettleAmt * days;

        console.log('diffDays : ', days);
        console.log('fullSettleAmt : ', fullSettleAmt);
        console.log('daySettleAmt : ', daySettleAmt);
        console.log('settleAmt : ', settleAmt);

        var userid = items.userid;

        var currencyRefDet = items.currencyRef;

        var updData = {};

        console.log('----- days : ', days);

        if (days != 0) {
          var insertData = {};
          insertData.userid = userid;
          insertData.currencyRef = currencyRefDet._id;
          insertData.stakingOrderRef = items._id;
          insertData.amount = settleAmt;
          insertData.status = 1;
          insertData.settleDate = d;
          insertData.days = days;

          var newStakingSettleList = new stakingSettleList(insertData);

          updData['$push'] = { settledList: newStakingSettleList._id };

          newStakingSettleList.save().then(result => {
          }).catch(err => console.log(err));
        }

        var findData = {};
        findData._id = items._id;

        updData.status = 2;

        updData.redemStatus = 2;
        updData.redemDate = d.setDate(d.getDate() + items.redemptionPeriod);;

        stakingOrder.findOneAndUpdate(findData, updData,
          {
            new: true
          }, function (err, response) {
            if (err) {
            } else if (response) {
              var assetFindData = {};
              assetFindData.userId = ObjectId(userid);
              assetFindData.currencySymbol = currencyRefDet.currencySymbol;

              Assets.findOneAndUpdate(assetFindData, {
                $inc: {
                  spotwallet: settleAmt
                }
              }, {
                new: true
              }, function (err, response) {
                retJsonObj.retMsg = 'Staking closed successfully.';
                retJsonObj.retType = 'success';
                return res.json(retJsonObj);
              });
            }
          })
      }
    });
});
router.get('/pair-data-first', (req, res) => {
  currency.find({}).then(user => {
    if (user) {
      return res.status(200).send(user);
      console.log(user, 'uesrezzzzzzz');
    }
  });
});
router.post('/stakingOrder', (req, res) => {
  console.log('stakingOrder : ');
  var retJsonObj = {};
  retJsonObj.target = 'stakingOrder';
  var bodyData = req.body;

  var userid = bodyData.userid;

  var insertData = {};
  insertData.userid = userid;
  insertData.stakeNowData = bodyData.stakeNowData;
  insertData.currencyRef = bodyData.stakeNowData.currencyRef._id;

  insertData.amount = bodyData.lockAmt;
  insertData.apy = bodyData.stakeNowData.defaultApy;
  insertData.type = bodyData.stakeNowData.defaultBtn;

  insertData.redemptionPeriod = bodyData.stakeNowData.redemptionPeriod;
  insertData.stakingRef = bodyData.stakeNowData._id;

  if (insertData.type == 'days') {
    insertData.duration = parseInt(bodyData.stakeNowData.defaultDay);
  }

  insertData.status = 1;
  retJsonObj.insertData = insertData;

  console.log('insertData : ', insertData);

  var balance = 0;

  var currencySymbol = bodyData.stakeNowData.currencyRef.currencySymbol;

  var assetFindData = {};
  assetFindData.userId = ObjectId(userid);
  assetFindData.currencySymbol = currencySymbol;

  var newStakingOrder = {};

  async.waterfall([
    function (done) {
      Assets.findOne(assetFindData, function (err, resA) {
        if (err) {
          retJsonObj.retMsg = 'Error occured.';
          retJsonObj.retType = 'danger';
          return res.json(retJsonObj);
        } else if (resA == null) {
          retJsonObj.retMsg = 'There is not enough asset in your balance.';
          retJsonObj.retType = 'danger';
          return res.json(retJsonObj);
        } else if (resA) {
          var spotwallet = resA.spotwallet;
          balance = spotwallet;
          done();
        }
      });
    },
    function (done) {
      if (balance < bodyData.lockAmt) {
        retJsonObj.retMsg = 'There is not enough asset in your balance.';
        retJsonObj.retType = 'danger';
        return res.json(retJsonObj);
      }
      done();
    },
    function (done) {
      var newBalance = balance - bodyData.lockAmt;
      Assets.findOneAndUpdate(assetFindData, {
        $inc: {
          spotwallet: -bodyData.lockAmt
        }
      }, {
        new: true
      }, function (err, response) {
        if (err) {
          retJsonObj.retMsg = 'Error occured.';
          retJsonObj.retType = 'danger';
          return res.json(retJsonObj);
        } else if (response) {
          done();
        }
      })
    },
    function (done) {
      newStakingOrder = new stakingOrder(insertData);
      var date = new Date(newStakingOrder.createdDate);

      if (newStakingOrder.type == 'flexible') {
        newStakingOrder.nextSettleDayCount = 7;
        newStakingOrder.SettleRemainingCount = 365 - newStakingOrder.nextSettleDayCount;
      } else if (newStakingOrder.type == 'days') {
        if (newStakingOrder.duration >= 7) {
          newStakingOrder.nextSettleDayCount = 7;
          newStakingOrder.SettleRemainingCount = newStakingOrder.duration - newStakingOrder.nextSettleDayCount;
        } else {
          newStakingOrder.nextSettleDayCount = newStakingOrder.duration;
          newStakingOrder.SettleRemainingCount = 0;
        }
      }

      newStakingOrder.nextSettleDate = date.setDate(date.getDate() + newStakingOrder.nextSettleDayCount);
      console.log('newStakingOrder : ', newStakingOrder);
      done();
    },
    function (done) {
      newStakingOrder.save().then(result => {
        retJsonObj.retMsg = 'Staking order added successfully.';
        retJsonObj.retType = 'success';
        return res.json(retJsonObj);
      }).catch(err => console.log(err));
    }
  ],
    function (err) {
    });

});

router.post('/staking', (req, res) => {
  console.log('staking : ');
  var retJsonObj = {};
  staking.find({})
    .populate('currencyRef')
    .then(result => {
      if (result) {
        if (result.length == 0) {
          return res.status(200).send(result);
        } else {
          result = JSON.stringify(result);
          result = JSON.parse(result);
          for (var i = 0; i < result.length; i++) {
            var curRep = result[i];
            var stakingName = curRep.currencyRef.currencySymbol;
            result[i].stakingName = stakingName;
            if (result.length - 1 == i) {
              retJsonObj.list = result;
              retJsonObj.target = 'stakingList';
              console.log('retJsonObj : ', retJsonObj);
              return res.json(retJsonObj);
            }
          }
        }
      }
    });
});

// router.post('/staking-flexible', (req, res) => {
//   console.log('staking-flexed : ');
//   var retJsonObj = {};
//   staking.find({"defaultBtn":"flexible"})
//   .populate('currencyRef')
//   .then(result => {
//     if (result) {
//       if(result.length==0){
//         return res.status(200).send(result);
//       } else {
//         result = JSON.stringify(result);
//         result = JSON.parse(result);
//         for (var i = 0; i < result.length; i++) {
//           var curRep = result[i];
//           var stakingName = curRep.currencyRef.currencySymbol;
//           result[i].stakingName = stakingName;
//           if(result.length-1 == i){
//             retJsonObj.list = result;
//             retJsonObj.target = 'stakingList';
//             console.log('retJsonObj : ',retJsonObj);
//             return res.json(retJsonObj);
//           }
//         }
//       }
//     }
//   });
// });
// router.post('/staking-flexed', (req, res) => {
//   console.log('staking-flexed : ');
//   var retJsonObj = {};
//   staking.find({"defaultBtn":"days"})
//   .populate('currencyRef')
//   .then(result => {
//     if (result) {
//       if(result.length==0){
//         return res.status(200).send(result);
//       } else {
//         result = JSON.stringify(result);
//         result = JSON.parse(result);
//         for (var i = 0; i < result.length; i++) {
//           var curRep = result[i];
//           var stakingName = curRep.currencyRef.currencySymbol;
//           result[i].stakingName = stakingName;
//           if(result.length-1 == i){
//             retJsonObj.list = result;
//             retJsonObj.target = 'stakingList';
//             console.log('retJsonObj : ',retJsonObj);
//             return res.json(retJsonObj);
//           }
//         }
//       }
//     }
//   });
// });

router.post('/staking-list', (req, res) => {
  var retJsonObj = {};
  retJsonObj.list = {};
  retJsonObj.list.flexible = [];
  retJsonObj.list.fixed = [];
  staking.find({})
    .populate('currencyRef')
    .then(result => {
      if (result) {
        if (result.length == 0) {
          return res.status(200).send(result);
        } else {
          result = JSON.stringify(result);
          result = JSON.parse(result);

          for (var i = 0; i < result.length; i++) {
            var curRep = result[i];
            var stakingName = curRep.currencyRef.currencySymbol;
            result[i].stakingName = stakingName;
            if (result[i].defaultBtn == 'flexible') {
              retJsonObj.list.flexible.push(result[i]);
            }

            if (result[i].periodList.length > 0) {

              retJsonObj.list.fixed.push(result[i]);
            }
            if (result.length - 1 == i) {
              retJsonObj.list.stakingRec = result;
              retJsonObj.target = 'stakingList';
              return res.json(retJsonObj);
            }
          }
        }
      }
    });
});

router.post('/staking_add', (req, res) => {
  const {
    errors,
    isValid
  } = validateAddStakingInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  var bodyData = req.body;
  console.log(bodyData, 'bodyData');
  var findData = {};
  findData.currencyRef = bodyData.currencyRef;
  console.log('findData : ', findData);
  staking.findOne(findData)
    .then(stakingdata => {
      console.log('stakingdata : ', stakingdata);
      if (stakingdata) {
        return res.status(400).json({
          currencyRef: 'Staking currency already exists'
        });
      } else {
        var periodList = bodyData.periodList;
        for (var i = 0; i < periodList.length; i++) {
          console.log('periodList[i] : ', periodList[i]);
          if (periodList[i].days == '' || periodList[i].apy == '') {
            periodList.splice(i, 1);
          }
        }

        var flexible = bodyData.flexible;

        var defaultBtn = '';
        var defaultDay = '';
        var defaultApy = '';

        if (flexible == true) {
          defaultBtn = 'flexible';
          defaultDay = 0;
          defaultApy = bodyData.flexibleApy;
        } else {
          if (bodyData.periodList.length > 0) {
            defaultBtn = 'days';
            defaultDay = bodyData.periodList[0].days;
            defaultApy = bodyData.periodList[0].apy;
          }
        }

        const newStaking = new staking({
          currencyRef: req.body.currencyRef,
          minimum: req.body.minimum,
          maximum: req.body.maximum,
          flexible: req.body.flexible,
          flexibleApy: req.body.flexibleApy,
          periodList: periodList,
          redemptionPeriod: req.body.redemptionPeriod,
        });

        newStaking.defaultDay = defaultDay;
        newStaking.defaultBtn = defaultBtn;
        newStaking.defaultApy = defaultApy;

        newStaking
          .save()
          .then(staking => {
            console.log(staking, 'staking');
            // staking_data(staking);
            return res.status(200).json({
              message: 'Staking added successfully. Refreshing data...'
            })
          }).catch(err => console.log(err));
      }
    });
});
router.post('/staking-delete', (req, res) => {
  console.log(req.body, 'resssss');
  var id = req.body._id;
  staking.deleteOne({
    _id: req.body._id
  }).then(stakingdata => {
    console.log(stakingdata, 'stakingdatarfgfhgjyghj');
    if (stakingdata) {
      console.log(id, 'idsssssssssss');
      delete_assets(id)
      return res.status(200).json({
        message: 'Staking deleted successfully. Refreshing data...'
      })
    }
  });
});

router.post("/staking_update", (req, res) => {
  const { errors, isValid } = validateAddStakingInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  var minabi = "";
  var contractaddress = "";
  var type = "";
  type = req.body.stakingType;
  minabi = JSON.stringify(req.body.minabi);
  contractaddress = req.body.contractaddress;
  const _id = req.body._id;
  const hidden_value = req.body.hidden;
  const hidden_value_name = req.body.hidden1;
  const curr_val = req.body.stakingSymbol;
  const curr_val_name = req.body.stakingName;
  let update = {
    stakingName: req.body.stakingName,
    stakingSymbol: req.body.stakingSymbol,
    fee: req.body.fee,
    minimum: req.body.minimum,
    minABI: minabi,
    type: type,
    contractAddress: contractaddress,
  };
  if (hidden_value == curr_val) {
    staking.update(
      {
        _id: _id,
      },
      {
        $set: update,
      },
      function (err, result) {
        if (result) {
          return res.status(200).json({
            message: "Staking updated successfully. Refreshing data...",
            success: true,
          });
        } else {
          if (hidden_value_name == curr_val_name) {
            staking.update(
              {
                _id: _id,
              },
              {
                $set: update,
              },
              function (err, result) {
                if (err) {
                  return res.status(400).json({
                    message: "Unable to update Staking.",
                  });
                } else {
                  return res.status(200).json({
                    message:
                      "Staking updated successfully. Refreshing data...",
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
        stakingName: req.body.stakingName,
      })
      .then((stakingdata) => {
        console.log(stakingdata, "stakingdata");
        if (stakingdata) {
          return res.status(400).json({
            stakingName: "Staking Name already exists",
          });
        } else {
          staking
            .findOne({
              stakingSymbol: req.body.stakingSymbol,
            })
            .then((stakingdata1) => {
              if (stakingdata1) {
                return res.status(400).json({
                  currencySymbol: "Staking Symbol already exists",
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
                        message: "Unable to update Staking.",
                      });
                    } else {
                      return res.status(200).json({
                        message:
                          "Staking updated successfully. Refreshing data...",
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
router.post('/asset-add', (req, res) => {
  const {
    errors,
    isValid
  } = validateUpdateAssetInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  console.log(req.body.pair, 'pair');
  if (req.body.first_currency == req.body.second_currency) {
    return res.status(400).json({
      first_currency: 'Currency pair is invalid'
    });
  } else {
    AssetExchange.findOne({
      pair: req.body.pair
    }).then(assetexchangedata => {
      console.log("assetExchangedata")
      if (assetexchangedata) {
        return res.status(400).json({
          second_currency: 'Currency pair is already exists'
        });
      } else {
        console.log("req.body========", req.body)
        const newassetexchange = new AssetExchange({
          pair: req.body.pair,
          from_currency: req.body.first_currency,
          to_currency: req.body.second_currency,
          single_min_limit: req.body.single_min_limit,
          single_max_limit: req.body.single_max_limit,
          full_min_limit: req.body.full_min_limit,
          full_max_limit: req.body.full_max_limit,
          trade_fee: req.body.trade_fee,
          status: req.body.status
        })
        newassetexchange.save().then(asset => {
          return res.status(200).json({
            message: 'Asset exchange added successfully. Refreshing data...'
          })
        }).catch(err => console.log(err));
      }
    })
  }
})


router.post('/asset-update', (req, res) => {
  console.log("Inside post update asset")
  console.log(req.body)
  const currency_val = req.body.pair;
  console.log(currency_val, 'currency_val');
  const {
    errors,
    isValid
  } = validateUpdateAssetInput(req.body);
  if (!isValid) {
    console.log("Error in validdd")
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
    status: req.body.status
  };

  if (req.body.first_currency == req.body.second_currency) {
    return res.status(400).json({
      first_currency: 'Currency pair is invalid'
    });
  } else {
    AssetExchange.update({
      _id: req.body._id
    }, {
      $set: newassetexchange
    }).then(contract => {
      console.log(contract, 'contractwertyui');
      return res.status(200).json({
        message: 'Asset Exchange updated uccessfully. Refreshing data...',
        success: true
      })
    }).catch(err => console.log(err));
  }



})

// })
cron.schedule("*/59 * * * *", (req, res) => {

  var getResult = {};
  var retJsonObj = {};

  var d = new Date();

  var nextSettleDateUpd = d.setDate(d.getDate() + 1);

  var currDate = d.getUTCDate();
  var currMonth = d.getMonth();
  var currYear = d.getUTCFullYear();
  var currHrs = d.getHours();

  currMonth = currMonth + 1;

  // currHrs = 13;
  // currDate = 19;

  console.log('currDate : ', currDate);
  console.log('currMonth : ', currMonth);
  console.log('currYear : ', currYear);
  console.log('currHrs : ', currHrs);

  // return false;

  async.waterfall([
    function (done) {

      var startDateTime = moment().subtract(1, 'days');

      // endDateTime = moment().set({hour:0,minute:0,second:0,millisecond:0})

      var findData = [
        {
          "$match": {
            "redemStatus": 2,
          }
        },
        {
          "$project": {
            "Atdate": {
              "$dayOfMonth": "$redemDate"
            },
            "AtMonth": {
              "$month": "$redemDate"
            },
            "AtYear": {
              "$year": "$redemDate"
            },
            "AtHrs": {
              "$hour": "$redemDate"
            },
            '_id': 1,
            'settledList': 1,
            'SettleRemainingCount': 1,
            'nextSettleDayCount': 1,
            'amount': 1,
            'type': 1,
            'apy': 1,
            'status': 1,
            'redemStatus': 1,
            'userid': 1,
            'currencyRef': 1,
            'createdDate': 1,
            'nextSettleDate': 1,
            'redemptionPeriod': 1
          }
        },
        {
          "$match": {
            "Atdate": currDate,
            "AtMonth": currMonth,
            "AtYear": currYear,
            "AtHrs": currHrs
          }
        },
        {
          "$project": {
            '_id': 1,
            'settledList': 1,
            'SettleRemainingCount': 1,
            'nextSettleDayCount': 1,
            'amount': 1,
            'type': 1,
            'apy': 1,
            'status': 1,
            'redemStatus': 1,
            'userid': 1,
            'currencyRef': 1,
            'createdDate': 1,
            'nextSettleDate': 1,
            'redemDate': 1,
            'redemptionPeriod': 1
          }
        },
        {
          "$lookup": {
            "from": "currency",
            "localField": "currencyRef",
            "foreignField": "_id",
            "as": "currencyRefDet"
          }
        }
      ];

      console.log('findData : ', findData);
      retJsonObj.findData = findData;
      // return res.json(findData);
      // return false;
      stakingOrder.aggregate(findData, function (err, resA) {
        if (err) {
          retJsonObj.err = err;
          retJsonObj.retMsg = 'Error occured.';
          retJsonObj.retType = 'danger';
          return res.json(retJsonObj);
        } else if (resA == null) {
          retJsonObj.retMsg = 'No order.';
          retJsonObj.retType = 'danger';
          return res.json(retJsonObj);
        } else if (resA) {
          getResult.stakingOrderList = resA;
          done();
        }
      });
    },
    function (done) {
      retJsonObj.getResult = getResult;
      // return res.json(retJsonObj);
      if (retJsonObj.getResult.length == 0) {
        done();
      } else {
        console.log('typeof retJsonObj.getResult : ', typeof retJsonObj.getResult);
        each(retJsonObj.getResult.stakingOrderList, async function (items, next) {
          if (items) {
            console.log('items : ', items);

            var currencyRefDet = items.currencyRefDet[0];

            var userid = items.userid;
            var apy = items.apy;
            var amount = items.amount;
            var nextSettleDayCount = items.nextSettleDayCount;

            var fullSettleAmt = (amount * apy) / 100;
            var daySettleAmt = fullSettleAmt / 365;
            var settleAmt = daySettleAmt * nextSettleDayCount;

            var settleAmt = amount;

            var insertData = {};
            insertData.userid = userid;
            insertData.currencyRef = currencyRefDet._id;
            insertData.stakingOrderRef = items._id;
            insertData.amount = settleAmt;
            insertData.status = 1;
            insertData.settleDate = d;
            insertData.days = items.redemptionPeriod;

            insertData.type = 'Redemption';

            var newStakingSettleList = new stakingSettleList(insertData);

            newStakingSettleList.save().then(result => {

              var findData = {};
              findData._id = items._id;

              var SettleRemainingCount = items.SettleRemainingCount;

              var updData = {};
              updData.nextSettleDateUpd = nextSettleDateUpd;

              console.log('SettleRemainingCount : ', SettleRemainingCount);

              updData.redemStatus = 3;

              updData['$push'] = { settledList: newStakingSettleList._id };

              stakingOrder.findOneAndUpdate(findData, updData,
                {
                  new: true
                }, function (err, response) {
                  if (err) {
                  } else if (response) {
                    var assetFindData = {};
                    assetFindData.userId = ObjectId(userid);
                    assetFindData.currencySymbol = currencyRefDet.currencySymbol;

                    Assets.findOneAndUpdate(assetFindData, {
                      $inc: {
                        spotwallet: settleAmt
                      }
                    }, {
                      new: true
                    }, function (err, response) {
                      next();
                    });
                  }
                })
            }).catch(err => console.log(err));
          } else {
            next();
          }
        }, function (err, transformedItems) {
          retJsonObj.sucMsg = 'Successfull send amount';
          console.log("retJsonObj", retJsonObj)
          // return res.json(retJsonObj);
        });
      }
    }
  ],
    function (err) {
    });

})


cron.schedule("*/59 * * * *", (req, res) => {


  var getResult = {};
  var retJsonObj = {};

  var d = new Date();

  var nextSettleDateUpd = d.setDate(d.getDate() + 1);

  var currDate = d.getUTCDate();
  var currMonth = d.getMonth();
  var currYear = d.getUTCFullYear();
  var currHrs = d.getHours();

  currMonth = currMonth + 1;

  // currHrs = 13;
  // currDate = 24;

  console.log('currDate : ', currDate);
  console.log('currMonth : ', currMonth);
  console.log('currYear : ', currYear);
  console.log('currHrs : ', currHrs);

  async.waterfall([
    function (done) {

      var startDateTime = moment().subtract(1, 'days');

      // endDateTime = moment().set({hour:0,minute:0,second:0,millisecond:0})

      var findData = [
        {
          "$match": {
            "status": 1,
            "redemStatus": 1,
            "nextSettleDayCount": { '$ne': 0 }
          }
        },
        {
          "$project": {
            "Atdate": {
              "$dayOfMonth": "$nextSettleDate"
            },
            "AtMonth": {
              "$month": "$nextSettleDate"
            },
            "AtYear": {
              "$year": "$nextSettleDate"
            },
            "AtHrs": {
              "$hour": "$nextSettleDate"
            },
            '_id': 1,
            'settledList': 1,
            'SettleRemainingCount': 1,
            'nextSettleDayCount': 1,
            'amount': 1,
            'type': 1,
            'apy': 1,
            'status': 1,
            'userid': 1,
            'currencyRef': 1,
            'createdDate': 1,
            'nextSettleDate': 1,
          }
        },
        {
          "$match": {
            "Atdate": currDate,
            "AtMonth": currMonth,
            "AtYear": currYear,
            "AtHrs": currHrs
          }
        },
        {
          "$project": {
            '_id': 1,
            'settledList': 1,
            'SettleRemainingCount': 1,
            'nextSettleDayCount': 1,
            'amount': 1,
            'type': 1,
            'apy': 1,
            'status': 1,
            'redemStatus': 1,
            'userid': 1,
            'currencyRef': 1,
            'createdDate': 1,
            'nextSettleDate': 1,
            'redemptionPeriod': 1
          }
        },
        {
          "$lookup": {
            "from": "currency",
            "localField": "currencyRef",
            "foreignField": "_id",
            "as": "currencyRefDet"
          }
        }
      ];

      console.log('findData : ', findData);
      retJsonObj.findData = findData;
      // return res.json(findData);
      // return false;
      stakingOrder.aggregate(findData, function (err, resA) {
        if (err) {
          retJsonObj.err = err;
          retJsonObj.retMsg = 'Error occured.';
          retJsonObj.retType = 'danger';
          return res.json(retJsonObj);
        } else if (resA == null) {
          retJsonObj.retMsg = 'No order.';
          retJsonObj.retType = 'danger';
          return res.json(retJsonObj);
        } else if (resA) {
          getResult.stakingOrderList = resA;
          done();
        }
      });
    },
    function (done) {
      retJsonObj.getResult = getResult;
      // return res.json(retJsonObj);
      if (retJsonObj.getResult.length == 0) {
        done();
      } else {
        console.log('typeof retJsonObj.getResult : ', typeof retJsonObj.getResult);
        each(retJsonObj.getResult.stakingOrderList, async function (items, next) {
          if (items) {
            console.log('items : ', items);

            var currencyRefDet = items.currencyRefDet[0];

            var userid = items.userid;
            var apy = items.apy;
            var amount = items.amount;
            var nextSettleDayCount = items.nextSettleDayCount;

            var fullSettleAmt = (amount * apy) / 100;
            var daySettleAmt = fullSettleAmt / 365;
            var settleAmt = daySettleAmt * nextSettleDayCount;

            var insertData = {};
            insertData.userid = userid;
            insertData.currencyRef = currencyRefDet._id;
            insertData.stakingOrderRef = items._id;
            insertData.amount = settleAmt;
            insertData.status = 1;
            insertData.settleDate = d;
            insertData.days = nextSettleDayCount;

            insertData.type = 'Interest';

            var newStakingSettleList = new stakingSettleList(insertData);

            newStakingSettleList.save().then(result => {

              var findData = {};
              findData._id = items._id;

              var SettleRemainingCount = items.SettleRemainingCount;

              var updData = {};
              updData.nextSettleDateUpd = nextSettleDateUpd;

              console.log('SettleRemainingCount : ', SettleRemainingCount);

              if (SettleRemainingCount >= 7) {
                updData.SettleRemainingCount = SettleRemainingCount - 7;
                updData.nextSettleDayCount = 7;
              } else if (SettleRemainingCount > 0) {
                updData.SettleRemainingCount = 0;
                updData.nextSettleDayCount = SettleRemainingCount;
              } else {
                updData.SettleRemainingCount = 0;
                updData.nextSettleDayCount = 0;
                updData.status = 3;
                updData.redemStatus = 2;

                var dd = new Date(items.nextSettleDate);
                updData.redemDate = dd.setDate(dd.getDate() + items.redemptionPeriod);
              }

              if (updData.nextSettleDayCount == 0) {
                // 
              } else {
                var dd = new Date(items.nextSettleDate);
                var nextSettleDateUpd = dd.setDate(dd.getDate() + updData.nextSettleDayCount);
                updData.nextSettleDate = nextSettleDateUpd;
              }

              updData['$push'] = { settledList: newStakingSettleList._id };

              stakingOrder.findOneAndUpdate(findData, updData,
                {
                  new: true
                }, function (err, response) {
                  if (err) {
                  } else if (response) {
                    var assetFindData = {};
                    assetFindData.userId = ObjectId(userid);
                    assetFindData.currencySymbol = currencyRefDet.currencySymbol;

                    Assets.findOneAndUpdate(assetFindData, {
                      $inc: {
                        spotwallet: settleAmt
                      }
                    }, {
                      new: true
                    }, function (err, response) {
                      next();
                    });
                  }
                })
            }).catch(err => console.log(err));
          } else {
            next();
          }
        }, function (err, transformedItems) {
          retJsonObj.sucMsg = 'Successfull send amount';
          console.log("retJsonObj", retJsonObj)
          ///return res.json(retJsonObj);
        });
      }
    }
  ],
    function (err) {
    });
})



router.post('/pair-add', (req, res) => {
  const {
    errors,
    isValid
  } = validateUpdatepairInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  console.log(req.body.tickerroot, 'tickerroot');
  if (req.body.first_currency == req.body.second_currency) {
    return res.status(400).json({
      first_currency: 'Currency pair is invalid'
    });
  } else {
    spotpairs.findOne({
      tiker_root: req.body.tickerroot
    }).then(currencydata2 => {
      console.log(currencydata2, 'currencydataaaaaaaaaaaaazzzzz');
      if (currencydata2) {
        return res.status(400).json({
          second_currency: 'Currency pair is already exists'
        });
      } else {
        const newcontract = new spotpairs({
          tiker_root: req.body.tickerroot.toUpperCase(),
          maxquantity: req.body.maxquantity,
          minquantity: req.body.minquantity,
          mark_price: req.body.mark_price,
          second_currency: req.body.second_currency.toUpperCase(),
          first_currency: req.body.first_currency.toUpperCase(),
          maker_rebate: req.body.maker_rebate,
          taker_fees: req.body.taker_fees,
          markuppercentage: req.body.markuppercentage,
          botstatus: req.body.botstatus,
          floatingDigits: req.body.floatingDigits

        });

        const newcharts = ([{
          type: '5',
          pairname: (req.body.tickerroot).toUpperCase(),
          data: [],
        }, {
          type: '1',
          pairname: (req.body.tickerroot).toUpperCase(),
          data: [],
        }, {
          type: '15',
          pairname: (req.body.tickerroot).toUpperCase(),
          data: [],
        }, {
          type: '30',
          pairname: (req.body.tickerroot).toUpperCase(),
          data: [],
        }, {
          type: '60',
          pairname: (req.body.tickerroot).toUpperCase(),
          data: [],
        }, {
          type: '1d',
          pairname: (req.body.tickerroot).toUpperCase(),
          data: [],
        }]);

        charts
          .insertMany(newcharts)
          .then(contract => {
            // return res.status(200).json({
            //     message: 'Pair added successfully. Refreshing data...'
            // })
          }).catch(err => console.log(err));

        newcontract
          .save()
          .then(contract => {

            initialChartSymbol([{
              'name': contract.tiker_root,
              'description': contract.tiker_root,
              'exchange': 'Trading',
              'type': 'crypto'
            }])

            return res.status(200).json({
              message: 'Pair added successfully. Refreshing data...'
            })
          }).catch(err => console.log(err));
      }
    });
  }
});

router.post('/pair-update', (req, res) => {
  console.log(req.body);
  const hidd_val = req.body.hidden;
  console.log(hidd_val, 'hidd_val');
  const currency_val = req.body.tickerroot;
  console.log(currency_val, 'currency_val');
  const {
    errors,
    isValid
  } = validateUpdatepairInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }
  const newcontract = {
    tiker_root: req.body.tickerroot,
    maxquantity: req.body.maxquantity,
    minquantity: req.body.minquantity,
    mark_price: req.body.mark_price,
    second_currency: req.body.second_currency,
    first_currency: req.body.first_currency,
    maker_rebate: req.body.maker_rebate,
    taker_fees: req.body.taker_fees,
    markuppercentage: req.body.markuppercentage,
    botstatus: req.body.botstatus,
    floatingDigits: req.body.floatingDigits

  };
  if (req.body.first_currency == req.body.second_currency) {
    return res.status(400).json({
      first_currency: 'Currency pair is invalid'
    });
  } else {
    spotpairs.update({
      _id: req.body._id
    }, {
      $set: newcontract
    }).then(contract => {
      console.log(contract, 'contractwertyui');
      return res.status(200).json({
        message: 'Pair updated uccessfully. Refreshing data...',
        success: true
      })
    }).catch(err => console.log(err));
  }
});


// router.post('/pair-add', (req, res) => {
//     const {
//         errors,
//         isValid
//     } = validateUpdatepairInput(req.body);
//     if (!isValid) {
//         return res.status(400).json(errors);
//     }
//     console.log(req.body.tickerroot, 'tickerroot');
//     if (req.body.first_currency == req.body.second_currency) {
//         return res.status(400).json({
//             first_currency: 'Currency pair is invalid'
//         });
//     } else {
//         spotpairs.findOne({
//             tiker_root: req.body.tickerroot
//         }).then(currencydata2 => {
//             console.log(currencydata2, 'currencydataaaaaaaaaaaaazzzzz');
//             if (currencydata2) {
//                 return res.status(400).json({
//                     second_currency: 'Currency pair is already exists'
//                 });
//             } else {
//                 const newcontract = new spotpairs({
//                     tiker_root: req.body.tickerroot.toUpperCase(),
//                     maxquantity: req.body.maxquantity,
//                     minquantity: req.body.minquantity,
//                     mark_price: req.body.mark_price,
//                     second_currency: req.body.second_currency.toUpperCase(),
//                     first_currency: req.body.first_currency.toUpperCase(),
//                     maker_rebate: req.body.maker_rebate,
//                     taker_fees: req.body.taker_fees,
//                 });
//
//                 const newcharts = ([{
//                     type: '5',
//                     pairname: (req.body.tickerroot).toUpperCase(),
//                     data: [],
//                 }, {
//                     type: '1',
//                     pairname: (req.body.tickerroot).toUpperCase(),
//                     data: [],
//                 }, {
//                     type: '15',
//                     pairname: (req.body.tickerroot).toUpperCase(),
//                     data: [],
//                 }, {
//                     type: '30',
//                     pairname: (req.body.tickerroot).toUpperCase(),
//                     data: [],
//                 }, {
//                     type: '60',
//                     pairname: (req.body.tickerroot).toUpperCase(),
//                     data: [],
//                 }, {
//                     type: '1d',
//                     pairname: (req.body.tickerroot).toUpperCase(),
//                     data: [],
//                 }]);
//
//                 charts
//                     .insertMany(newcharts)
//                     .then(contract => {
//                         // return res.status(200).json({
//                         //     message: 'Pair added successfully. Refreshing data...'
//                         // })
//                     }).catch(err => console.log(err));
//
//                 newcontract
//                     .save()
//                     .then(contract => {
//                         return res.status(200).json({
//                             message: 'Pair added successfully. Refreshing data...'
//                         })
//                     }).catch(err => console.log(err));
//             }
//         });
//     }
// });
//
// router.post('/pair-update', (req, res) => {
//     console.log(req.body);
//     const hidd_val = req.body.hidden;
//     console.log(hidd_val, 'hidd_val');
//     const currency_val = req.body.tickerroot;
//     console.log(currency_val, 'currency_val');
//     const {
//         errors,
//         isValid
//     } = validateUpdatepairInput(req.body);
//
//     if (!isValid) {
//         return res.status(400).json(errors);
//     }
//     const newcontract = {
//         tiker_root: req.body.tickerroot,
//         maxquantity: req.body.maxquantity,
//         minquantity: req.body.minquantity,
//         mark_price: req.body.mark_price,
//         second_currency: req.body.second_currency,
//         first_currency: req.body.first_currency,
//         maker_rebate: req.body.maker_rebate,
//         taker_fees: req.body.taker_fees,
//     };
//     if (req.body.first_currency == req.body.second_currency) {
//         return res.status(400).json({
//             first_currency: 'Currency pair is invalid'
//         });
//     } else {
//         spotpairs.update({
//             _id: req.body._id
//         }, {
//             $set: newcontract
//         }).then(contract => {
//             console.log(contract, 'contractwertyui');
//             return res.status(200).json({
//                 message: 'Pair updated uccessfully. Refreshing data...',
//                 success: true
//             })
//         }).catch(err => console.log(err));
//     }
// });

router.post('/pair-delete', (req, res) => {
  spotpairs.deleteOne({
    _id: req.body._id
  }).then(faq => {
    if (faq) {
      return res.status(200).json({
        message: 'Pair deleted successfully. Refreshing data...',
        success: true
      })
    }
  });
});

router.post('/changepassword', (req, res) => {
  const {
    errors,
    isValid
  } = validateRegisterInput(req.body, 'password');
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const id = req.body._id;
  User.findById(id).then(user => {
    bcrypt.compare(req.body.oldpassword, user.password).then(isMatch => {
      if (isMatch) {
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(req.body.password, salt, (err, hash) => {
            if (err) throw err;
            let update = {
              'password': hash
            };
            User.update({
              _id: req.body._id
            }, {
              $set: update
            }, function (err, result) {
              if (err) {
                return res.status(400).json({
                  message: 'Unable to update user.'
                });
              } else {
                return res.status(200).json({
                  message: 'Password updated successfully. Refreshing data...',
                  success: true
                });
              }
            });
          });
        });
      } else {
        return res
          .status(400)
          .json({
            oldpassword: 'Old password is wrong.'
          });
      }
    });
  });
});

router.post('/asset-data/', (req, res) => {

  AssetExchange.find({}).then(result => {
    if (result) {
      return res.status(200).json({
        status: true,
        data: result
      });
    }
  });
});

router.post('/spotpair-data/', (req, res) => {

  spotpairs.find({}).then(result => {
    if (result) {
      return res.status(200).json({
        status: true,
        data: result
      });
    }
  });
});

router.post('/currency', (req, res) => {
  currency.find({}).then(result => {
    if (result) {
      return res.status(200).send(result);
    }
  });
});

// router.post('/currency_add', (req, res) => {
//     const {
//         errors,
//         isValid
//     } = validateAddCurrencyInput(req.body);
//     if (!isValid) {
//         return res.status(400).json(errors);
//     }
//     console.log(req.body, 'bodissssssssssssss');
//     var currency1 = req.body.currencyName;
//     var currency2 = req.body.currencySymbol;
//     console.log(currency2, 'currency2');
//     currency.findOne({
//         currencyName: req.body.currencyName
//     }).then(currencydata2 => {
//         console.log(currencydata2, 'currencydataaaaaaaaaaaaazzzzz');
//         if (currencydata2) {
//             return res.status(400).json({
//                 currencyName: 'Currency already exists'
//             });
//         } else {
//             currency.findOne({
//                 currencySymbol: req.body.currencySymbol
//             }).then(currencydata => {
//                 if (currencydata) {
//                     return res.status(400).json({
//                         currencySymbol: 'Currency Symbol already exists'
//                     });
//                 } else {
//                     const newCurrency = new currency({
//                         currencyName   : req.body.currencyName,
//                         currencySymbol : req.body.currencySymbol,
//                         fee            : req.body.fee,
//                         minimum            : req.body.minimum,
//                     });
//                     newCurrency
//                         .save()
//                         .then(currency => {
//                             console.log(currency, 'currency');
//                             currency_data(currency);
//                             return res.status(200).json({
//                                 message: 'Currency added successfully. Refreshing data...'
//                             })
//                         }).catch(err => console.log(err));
//                 }
//             });
//         }
//     });
// });


router.post('/currency-delete', (req, res) => {
  console.log(req.body, 'resssss');
  var id = req.body._id;
  currency.deleteOne({
    _id: req.body._id
  }).then(currencydata => {
    console.log(currencydata, 'currencydatarfgfhgjyghj');
    if (currencydata) {
      console.log(id, 'idsssssssssss');
      delete_assets(id)
      return res.status(200).json({
        message: 'Currency deleted successfully. Refreshing data...'
      })
    }
  });
});

router.post("/currency_update", (req, res) => {
  const { errors, isValid } = validateAddCurrencyInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  var minabi = "";
  var contractaddress = "";
  var type = "";
  type = req.body.currencyType;
  minabi = JSON.stringify(req.body.minabi);
  contractaddress = req.body.contractaddress;
  const _id = req.body._id;
  const hidden_value = req.body.hidden;
  const hidden_value_name = req.body.hidden1;
  const curr_val = req.body.currencySymbol;
  const curr_val_name = req.body.currencyName;
  console.log(req.body, "aiyyyyyyyyyyyyoooooovathuruma");
  let update = {
    currencyName: req.body.currencyName,
    currencySymbol: req.body.currencySymbol,
    fee: req.body.fee,
    minimum: req.body.minimum,
    minABI: minabi,
    type: type,
    contractAddress: contractaddress,
  };
  if (hidden_value == curr_val) {
    currency.update(
      {
        _id: _id,
      },
      {
        $set: update,
      },
      function (err, result) {
        if (result) {
          return res.status(200).json({
            message: "Currnecy updated successfully. Refreshing data...",
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
                      "Currnecy updated successfully. Refreshing data...",
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

function currency_data(currency) {
  User.find({}, function (err, userdetails) {
    if (userdetails) {
      userdetails.forEach(function (res) {
        var userId = res._id;
        var insertobj = {
          "balance": 0,
          "currency": currency._id,
          "currencySymbol": currency.currencySymbol
        };

        const newContact = new Assets({
          "balance": 0,
          "currency": currency._id,
          "currencySymbol": currency.currencySymbol,
          "userId": userId
        });
        console.log(newContact, 'newContact');
        newContact.save(function (err, data) {
          console.log("success");
        });
      });

    }
  });
}

function delete_assets(id) {
  Assets.deleteMany({
    currency: id
  }).then(currencydata => {
    console.log(currencydata, 'currency ideaaaaaaaaaaaa');
    if (currencydata) {
      console.log("successfully");
    }
  });
}




function referralfee(amount, currency) {
  async.waterfall([
    function (done) {
      if (currency === BTC) {
        Feetable.find({}, function (err, feedetails) {
          if (err) {
            console.log("Errrorrrrr", err)
          }
          console.log("Fee Details", feedetails)
          feeamount = feedetails.minamount
          discount = feedetails.firstlevel
          done();
        })
      } else {
        console.log("The Bonus is only for BTC deposits")
        done();
      }
    },
    function (done) {
      if (amount >= feeamount) {
        perpetual.findOne({
          first_currency: "BTC"
        }, function (err, result) {
          if (err) {
            console.log("Error in finding currency", err)
          }
          console.log("Dataa from perpetual table", result)
          markprice = result.markprice
          console.log("Markprice==", markprice)
          done();
        })

      } else {
        console.log("The deposited amount is low for the discount,Please deposit more for the discount")
        done();
      }
    },
    function (done) {
      temp_balance = feeamount / markprice;
      console.log("bonus money to add", temp_balance)
      User.findOne({
        _id: _id
      }, function (err, userdetails) {
        if (err) {
          console.log("No referrals found")
          done();
        }
        referral_id = userdetails.referaluserid;
        Assets.findOneAndUpdate({
          userId: referral_id
        }, {
          $inc: {
            tempcurrency: temp_balance
          }
        }, {
          new: true
        }, function (err, response) {
          if (err) {
            console.log("Error", error)
            done();
          }
          console.log("updated Temp balance", response)

        })
      })

    }
  ],
    function (err) { });
  return res.status(200).json({
    message: 'Temp Balance updated'
  })
}


router.get("/trade_history/spot", (req, res) => {
  console.log("req.query.", req.query)
  var perPage = req.query.page_size ? req.query.page_size : 10
  var page = req.query.page_number ? req.query.page_number : 1
  var skippage = (perPage * page) - perPage;
  var search = req.query.filter_value;
  var sort_column = req.query.sort_column;
  var sort_order = req.query.sort_order;
  var sortprocess = {};
  if (typeof sort_column !== 'undefined' && sort_column && sort_column !== '' && typeof sort_order !== 'undefined' && sort_order && sort_order !== '') {
    sortprocess[sort_column] = sort_order == 'asc' ? 1 : -1;
  }
  else {
    sortprocess['_id'] = -1;
  }

  if (typeof search !== 'undefined' && search && search !== '') {
    filter = {
      $or: [
        { "user.email": new RegExp(search, "i") },
        { createdDate: { '$regex': search } },
        { quantity: { '$regex': search } },
        { pairName: new RegExp(search, "i") },
        { price: { '$regex': search } },
        { orderType: new RegExp(search, "i") },
        { _id: { '$regex': search } },
      ]
    }
  } else {
    filter = {}
  }

  var skippage = (perPage * page) - perPage;
  spottradeTable.aggregate([
    {
      "$lookup": {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    { $match: filter },
    {
      $project: {
        quantity: "$quantity",
        email: "$user.email",
        filled: "$filled",
        price: "$price",
        orderValue: "$orderValue",
        filledAmount: "$filledAmount",
        orderType: "$orderType",
        buyorsell: "$buyorsell",
      }
    }
  ]).sort(sortprocess).skip(skippage).limit(parseInt(perPage)).exec(function (txerr, result) {

    spottradeTable.aggregate([
      {
        "$lookup": {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      { $match: filter },
      {
        $project: {
          quantity: "$quantity",
          email: "$user.email",
        }
      }
    ]).exec(function (err, count) {
      if (err) {
        console.log(
          err
        )
        res.status(500).json({ status: false, message: 'Internal Server Error' });
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
            var name = result[i].email ? result[i].email : "";
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
            totalcount: count.length
          });
        }
      }
    });
  });
});

router.post('/trade_history/spot', (req, res) => {
  tradeTable.find({
    status: 1
  }).populate('userId', 'email').sort({ "_id": -1 }).then(result => {
    if (result) {
      resultarr = [];
      for (i = 0; i < result.length; i++) {
        var quantity = result[i].quantity ? result[i].quantity : 0;
        var name = result[i].userId.email.split('@')[0] ? result[i].userId.email.split('@')[0] : 0;
        var price = result[i].price ? result[i].price : 0;
        var orderValue = result[i].orderValue ? result[i].orderValue : 0;
        var orderType = result[i].orderType ? result[i].orderType : 0;
        var _id = result[i]._id ? result[i]._id : 0;
        var classs = result[i].buyorsell == 'buy' ? 'greenText' : 'pinkText';
        var filledAmount = result[i].filledAmount ? result[i].filledAmount : 0;
        var Remaining = parseFloat(quantity) - parseFloat(filledAmount);
        for (j = 0; j < result[i].filled.length; j++) {
          var created_at = result[i].filled[j].created_at ? result[i].filled[j].created_at : '';
          var Price = result[i].filled[j].Price ? result[i].filled[j].Price : 0;
          var pairname = result[i].filled[j].pairname ? result[i].filled[j].pairname : 0;
          var data1 = new Date(created_at);
          let date = data1.getFullYear() + '-' + (data1.getMonth() + 1) + '-' + data1.getDate() + ' ' + data1.getHours() + ':' + data1.getMinutes() + ':' + data1.getSeconds();
          resultobj = { "pairname": pairname, "name": name, "filledtype": "Trade", "filledAmount": parseFloat(filledAmount).toFixed(8), "Price": parseFloat(Price).toFixed(2), "orderValue": parseFloat(orderValue).toFixed(2), "Remaining": parseFloat(Remaining).toFixed(8), "orderType": orderType, "_id": _id, "date": date }
          resultarr.push(resultobj);
        }
      }


      return res.status(200).json({
        status: true,
        data: resultarr
      });
    }
  });
});

router.post('/closed_history/', (req, res) => {
  position_table.find({}).populate({ path: 'userId', select: 'email' }).sort({ "_id": -1 }).then(result => {
    if (result) {
      var resultarr = [];
      for (i = 0; i < result.length; i++) {
        var user_id = result[i].userId ? result[i].userId.email : '';
        var quantity = result[i].quantity ? result[i].quantity : 0;
        var pairname = result[i].pairname ? result[i].pairname : '';
        var entry_price = result[i].entry_price ? result[i].entry_price : '';
        var profitnloss = result[i].profitnloss ? result[i].profitnloss : 0;
        var exit_price = result[i].exit_price ? result[i].exit_price : '';
        var createdDate = result[i].createdDate ? result[i].createdDate : '';
        var closing_direction = result[i].closing_direction ? result[i].closing_direction : '';
        var data1 = new Date(createdDate);
        let date = data1.getFullYear() + '-' + (data1.getMonth() + 1) + '-' + data1.getDate() + ' ' + data1.getHours() + ':' + data1.getMinutes() + ':' + data1.getSeconds();
        if (quantity != 0) {
          resultobj = { "pairname": pairname, "user_id": user_id, "quantity": parseFloat(quantity).toFixed(8), "entry_price": parseFloat(entry_price).toFixed(2), "exit_price": parseFloat(exit_price).toFixed(2), "profitnloss": (profitnloss != 0) ? parseFloat(profitnloss).toFixed(8) : '0', "closing_direction": closing_direction, "createdDate": date }
          resultarr.push(resultobj);

        }
      }

      return res.status(200).json({
        status: true,
        data: resultarr
      });
    }
  });
});

router.post('/order_history/spot', (req, res) => {
  spottradeTable.find({}).populate('userId', 'email').sort({ "_id": -1 }).then(result => {
    if (result) {
      resultarr = [];
      for (i = 0; i < result.length; i++) {

        var pairName = result[i].pairName ? result[i].pairName : '';
        var quantity = result[i].quantity ? result[i].quantity : 0;
        var name = result[i].userId.email.split('@')[0] ? result[i].userId.email.split('@')[0] : 0;
        var price = result[i].quantity ? result[i].price : 0;
        var orderValue = result[i].orderValue ? result[i].orderValue : 0;
        var orderType = result[i].orderType ? result[i].orderType : 0;
        var orderDate = result[i].orderDate ? result[i].orderDate : 0;
        var classs = result[i].buyorsell == 'buy' ? 'greenText' : 'pinkText';
        var _id = result[i]._id ? result[i]._id : 0;
        var status1 = result[i].status;
        var e_price = result[i].filled.length > 0 ? result[i].filled[0].Price : 0;
        var filledAmount = result[i].filledAmount ? result[i].filledAmount : 0;
        var Remaining = parseFloat(quantity) - parseFloat(filledAmount);
        var data1 = new Date(orderDate);
        let date = data1.getFullYear() + '-' + (data1.getMonth() + 1) + '-' + data1.getDate() + ' ' + data1.getHours() + ':' + data1.getMinutes() + ':' + data1.getSeconds();

        var status = (result[i].status == 0) ? "New" : (result[i].status == 1) ? "Completed" : (result[i].status == 2) ? "Partial" : (result[i].status == 3) ? "Cancel" : "";

        resultobj = { "pairName": pairName, "name": name, "filledAmount": parseFloat(filledAmount).toFixed(8), "price": parseFloat(price).toFixed(2), "orderValue": parseFloat(orderValue).toFixed(2), "Remaining": parseFloat(Remaining).toFixed(8), "quantity": parseFloat(quantity).toFixed(8), "orderType": orderType, "_id": _id, "date": date, "e_price": e_price, "status": status }
        resultarr.push(resultobj);
      }
      return res.status(200).json({
        status: true,
        data: resultarr
      });
    }
  });
});

router.post('/Botfunction', (req, res) => {
  console.log('Botfunction', req.body)
  var orderType = "Limit"
  var buyorsell = req.body.buyorsell.value;
  spotpairs.findOne({ tiker_root: req.body.pair.value }).then(spotpairs => {
    if (spotpairs) {
      spotpairs.buyorselldata = buyorsell;
      spotpairs.orderTypedata = orderType;
      spotpairs.pricerangestart = req.body.pricerangestart;
      spotpairs.pricerangeend = req.body.pricerangeend;
      spotpairs.quantityrangestart = req.body.quantityrangestart;
      spotpairs.quantityrangeend = req.body.quantityrangeend;
      spotpairs.ordercount = req.body.ordercount;
      generateBuySpotOrder(spotpairs);
      res.json({ status: true, message: "Order Placing successfully" })
    }
  })

});

function generateBuySpotOrder(spotpairs) {
  var buyorsell = spotpairs.buyorselldata
  var ordertype = spotpairs.orderTypedata;
  var ordercount = spotpairs.ordercount;
  var i = 0;
  generateTenSpotOrder(spotpairs, function () {
    console.log("i valueesa/*/*/*/*/*", i);
    if (i === ordercount - 1) {
    } else {
      i += 1;
      spotpairs.orderTypedata = ordertype
      spotpairs.buyorselldata = buyorsell
      generateTenSpotOrder(spotpairs);
    }
  });
}

function generateTenSpotOrder(spotpairs, callBackTwo) {
  if (callBackTwo) {
    userinfo.spotplacingover = callBackTwo;
  }

  var pairname = spotpairs.tiker_root;

  var buyorsell = spotpairs.buyorselldata
  var ordertype = spotpairs.orderTypedata;
  var useridstatic = ObjectId("5e567694b912240c7f0e4299")

  var contractdetails = spotpairs
  var timeinforcetype = "GoodTillCancelled";
  var trigger_price = 0;
  var trigger_type = null;
  var randommulti = Math.random() * (+contractdetails.quantityrangestart - +contractdetails.quantityrangeend) + +contractdetails.quantityrangeend
  var randomprice = Math.random() * (+contractdetails.pricerangestart - +contractdetails.pricerangeend) + +contractdetails.pricerangeend

  var randomquantity = randommulti.toFixed(4)

  var price = randomprice.toFixed(8);
  var order_value = parseFloat(randomquantity * price).toFixed(8);

  var before_reduce_bal = 0
  var after_reduce_bal = 0

  var float = (pairname == 'BTCUSDT' || pairname == 'ETHUSDT') ? 2 : 8;
  const newtradeTable = new spottradeTable({
    quantity: parseFloat(randomquantity),
    price: parseFloat(price).toFixed(float),
    trigger_price: trigger_price,
    orderValue: order_value,
    userId: useridstatic,
    pair: contractdetails._id,
    pairName: pairname,
    beforeBalance: before_reduce_bal,
    afterBalance: after_reduce_bal,
    timeinforcetype: timeinforcetype,
    firstCurrency: contractdetails.first_currency,
    secondCurrency: contractdetails.second_currency,
    orderType: ordertype,
    trigger_type: trigger_type,
    orderDate: new Date(),
    buyorsell: buyorsell,
    status: (trigger_type != null) ? 4 : 0 // //0-pending, 1-completed, 2-partial, 3- Cancel, 4- Conditional
  });
  newtradeTable.save().then(async curorder => {
    console.log("order placedd");
    let spotPairData = await SpotPairs.findOne({ 'tiker_root': curorder.pairName })
    console.log("----spotPairData", spotPairData)
    console.log("----spotPairData.markprice && spotPairData.markprice > 0 && curorder.buyorsell == 'buy' && curorder.price <= spotPairData.markprice", spotPairData.markprice && spotPairData.markprice > 0 && curorder.buyorsell == 'buy' && curorder.price <= spotPairData.markprice)
    if (spotPairData) {
      if (spotPairData.markprice && spotPairData.markprice > 0 && curorder.buyorsell == 'sell' && curorder.price <= spotPairData.markprice) {
        let orderValue = parseFloat(curorder.quantity * curorder.price);
        var buyfee = orderValue * parseFloat(spotPairData.taker_fees) / 100;

        var selltempdata = {
          "pair": curorder.pair,
          "firstCurrency": curorder.firstCurrency,
          "secondCurrency": curorder.secondCurrency,
          "buyuserId": curorder.buyuserId,
          "user_id": curorder.user_id,
          "selluserId": curorder.selluserId,
          "sellId": curorder.sellId,
          "buyId": curorder.buyId,
          "filledAmount": +(curorder.quantity).toFixed(8),
          "Price": +curorder.price,
          "pairname": curorder.pairname,
          "status": "filled",
          "Type": "sell",
          "Fees": parseFloat(buyfee).toFixed(8),
          "created_at": new Date(),
          "beforeBalance": 0,
          "afterBalance": 0,
          "order_value": orderValue,
        }

        await spottradeTable.findOneAndUpdate(
          { _id: curorder._id },
          {
            "$set": {
              "status": "1",
              "filled": selltempdata
            },
            "$inc": {
              "filledAmount": parseFloat(curorder.quantity)
            }
          }, { new: true, "fields": { status: 1, filled: 1 } }
        );
      } else if (spotPairData.markprice && spotPairData.markprice > 0 && curorder.buyorsell == 'buy' && curorder.price >= spotPairData.markprice) {
        let orderValue = parseFloat(curorder.quantity * curorder.price);
        var buyfee = orderValue * parseFloat(spotPairData.taker_fees) / 100;

        var buytempdata = {
          "pair": curorder.pair,
          "firstCurrency": curorder.firstCurrency,
          "secondCurrency": curorder.secondCurrency,
          "buyuserId": curorder.buyuserId,
          "user_id": curorder.user_id,
          "selluserId": curorder.selluserId,
          "sellId": curorder.sellId,
          "buyId": curorder.buyId,
          "filledAmount": +(curorder.quantity).toFixed(8),
          "Price": +curorder.price,
          "pairname": curorder.pairname,
          "status": "filled",
          "Type": "buy",
          "Fees": parseFloat(buyfee).toFixed(8),
          "created_at": new Date(),
          "beforeBalance": 0,
          "afterBalance": 0,
          "order_value": orderValue,
        }

        await spottradeTable.findOneAndUpdate(
          { _id: curorder._id },
          {
            "$set": {
              "status": "1",
              "filled": buytempdata
            },
            "$inc": {
              "filledAmount": parseFloat(curorder.quantity)
            }
          }, { new: true, "fields": { status: 1, filled: 1 } }
        );
      }
    }
    userinfo.spotplacingover()

  }).catch(err => {
    console.log(err, 'error');

  });
}

router.post("/spotbot-delete", (req, res) => {
  var useridstatic = ObjectId("5e567694b912240c7f0e4299")
  var buyorsell = req.body.buyorsell.value;
  var pairname = req.body.pairname.value;
  spottradeTable.deleteMany({
    pairName: pairname,
    userId: useridstatic,
    buyorsell: buyorsell,
    status: 0
  }).then((currencydata) => {
    console.log("------currencydata", currencydata)
    res.json({ status: true, message: "Order Deleted successfully" })
  })
})

module.exports = router;
