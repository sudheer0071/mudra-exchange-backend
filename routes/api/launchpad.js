const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const keys = require('../../config/keys');
const async = require("async");
const nodemailer = require('nodemailer');
const multer = require('multer');
const Launchpad = require('../../models/Launchpad');
const LaunchpadHistory = require('../../models/LaunchpadHistory');
const validateLaunchpadInput= require('../../validation/launchpad');
const validateApplyLaunchpadInput= require('../../validation/applylaunchpad');
const Emailtemplates = require('../../models/emailtemplate');
const { initialChartSymbol } = require('../symbols_database');
const userinfo = [];
const ObjectId = mongoose.Types.ObjectId;
var cron = require("node-cron");
const moment = require('moment');
var each = require('sync-each');
const Assets = require("../../models/Assets");

router.post('/launchpad-data',(req,res)=>{
Launchpad.find({status:"Activated"}).then(data => {
if (data) {
      return res.status(200).send(data);
    }
})
})

router.post('/launchpad-details',(req,res)=>{
Launchpad.find({}).then(data => {
if (data) {
      return res.status(200).send(data);
    }
})
})

router.post('/launchpad-data/:id',(req,res)=>{
  Launchpad.find({lauchpadid:req.params.id}).then(data => {
    if (data) {
      return res.status(200).send(data);
    }
   })
})

router.post('/token-approved',(req,res)=>{
  var findData=ObjectId(req.body._id)
  Launchpad.findOne({ _id: findData }, { status: 1 }).then((results) => {
   if (results.status != "Activated" ) {
        var title = "Activated";
      } else {
        var newstatus = 1;
        var title = "DeActivated";
      }

   Launchpad.findOneAndUpdate(
        { _id: findData },
        { $set: { status: title } },
        { new: true }
      ).exec(function (uperr, resUpdate) {
        if (!uperr) {
          var logo = keys.baseUrl + "Logo-small.png";
          if (resUpdate=="Activated") {
             var jsonfilter = {
              identifier: "token_approved",
            };
        Emailtemplates.findOne(
            jsonfilter,
            {
              _id: 0,
            },
            async  function (err, templates) {
              if (templates) {

           let checklaunch = await Launchpad.findOne({ "_id": ObjectId(findData) });
           let checkUser1 = await User.findOne({ "_id": ObjectId(checklaunch.userid) });

                if (templates.content) {
                    var templateData = {}
                  templateData = templates;
                  templateData.content = templateData.content.replace(
                    /##templateInfo_name##/g,
                    checkUser1.email
                  );

                   var smtpConfig = {
    
                    service: "privateemail",
                    auth: {
                      user: "helloomneety@gmail.com",
                      pass: "Omneety@1234000",
                    },
                    host: "smtp.gmail.com",
                    port: "587",
                  };
        var transporter = nodemailer.createTransport(smtpConfig);

        var mailOptions = {
          from: "noreply@doublejack.world", // sender address
          to: checkUser1.email, // list of receivers
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
            }
            );

          }else{
          }
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


})

})

router.post('/launchpad-history/:id',(req,res)=>{
  LaunchpadHistory.find({userid:ObjectId(req.params.id)}).then(data => {
  	
    if (data) {
      return res.status(200).send(data);
    }
   })
})


router.post('/launchpad-delete', (req, res) => {
  Launchpad.deleteOne({ _id: req.body._id }).then(user => {
    if (user) {
      return res.status(200).json({ message: 'Launchpad data deleted successfully. Refreshing data...', success: true })
    }
  });
});


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/launchpad')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

var upload = multer({ storage: storage });

router.post('/add-Launchpad', upload.single('file1'),(req,res)=>{

var bodyData=req.body;

 const file = req.file; 

const { errors, isValid } = validateLaunchpadInput(bodyData, 'register');
  if (!isValid) {
    return res.status(400).json(errors);
  }
  if (file != "" && file != undefined) {
    User.find({}, { lauchpadid: 1 }, { sort: { lauchpadid: -1 }, limit: 1 }).then(
      async (latesuser) => {

    var latestId = 1;
        if (
          latesuser &&
          latesuser.length > 0 &&
          latesuser[0].lauchpadid &&
          latesuser[0].lauchpadid > 0
        ) {
          latestId = parseInt(latesuser[0].lauchpadid) + parseInt(1);
        }

   const launchpaddata=new Launchpad({
	tokenname:bodyData.tokenname,
	lauchpadid:latestId,
	symbol:bodyData.symbol,
	availablecurrency:bodyData.availablecurrency,
	price:bodyData.price,
	minAmt:bodyData.minAmt,
	discount:bodyData.discount,
	availablesale:bodyData.availablesale,
	maxsupply:bodyData.maxsupply,
	industry:bodyData.industry,
	website:bodyData.website,
	content:bodyData.content,
	curimage:file.filename,
	startdate:bodyData.startdate,
  enddate:bodyData.endDate,
 
})
    var retJsonObj={};	
    launchpaddata.save().then(result=>{
       retJsonObj.retMsg = 'Launchpad Contactus added successfully';
        retJsonObj.retType = 'success';
        return res.json(retJsonObj);
    }).catch(err => console.log(err,'gggggggggg'));

   })

   }else{
	Launchpad.find({}, { lauchpadid: 1 }, { sort: { lauchpadid: -1 }, limit: 1 }).then(
      async (latesuser) => {
    var latestId = 1;
        if (
          latesuser &&
          latesuser.length > 0 &&
          latesuser[0].lauchpadid &&
          latesuser[0].lauchpadid > 0
        ) {
          latestId = parseInt(latesuser[0].lauchpadid) + parseInt(1);
        }
   const launchpaddata=new Launchpad({
	tokenname:bodyData.tokenname,
	lauchpadid:latestId,
	symbol:bodyData.symbol,
	availablecurrency:bodyData.availablecurrency,
	price:bodyData.price,
	minAmt:bodyData.minAmt,
	discount:bodyData.discount,
	availablesale:bodyData.availablesale,
	maxsupply:bodyData.maxsupply,
	industry:bodyData.industry,
	website:bodyData.website,
	content:bodyData.content,
	startdate:bodyData.startdate,
  enddate:bodyData.enddate,

})
launchpaddata.save().then(result=>{
       retJsonObj.retMsg = 'Launchpad Contactus added successfully';
        retJsonObj.retType = 'success';
        return res.json(retJsonObj);

}).catch(err => console.log(err,'gggggggggg'));


  })
}

})


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/launchpad')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

var upload = multer({ storage: storage });

router.post('/update-Launchpad', upload.single('file1'),(req,res)=>{

 var bodyData=req.body;
 var findData=bodyData._id;
 const file = req.file; 

  if (file != "" && file != undefined) {
       var findData=bodyData._id;
       var updData = {};
         updData.tokenname=bodyData.tokenname;
         updData.symbol=bodyData.symbol;
         updData.availablecurrency=bodyData.availablecurrency;
         updData.price=bodyData.price;
         updData.minAmt=bodyData.minAmt;
         updData.discount=bodyData.discount;
         updData.availablesale=bodyData.availablesale;
         updData.maxsupply=bodyData.maxsupply;
         updData.industry=bodyData.industry;
         updData.website=bodyData.website;
         updData.content=bodyData.content;
          var retJsonObj={}; 
        Launchpad.findOneAndUpdate(findData, updData,
         {
            new: true
        }, function (err, response) {
        retJsonObj.retMsg = 'Launchpad Details updated successfully';
        retJsonObj.retType = 'success';
        return res.json(retJsonObj);
      })   

   }else{
      var findData=bodyData._id;
      console.log("findData",findData)
       var updData = {};
         updData.tokenname=bodyData.tokenname;
         updData.symbol=bodyData.symbol;
         updData.availablecurrency=bodyData.availablecurrency;
         updData.price=bodyData.price;
         updData.minAmt=bodyData.minAmt;
         updData.discount=bodyData.discount;
         updData.availablesale=bodyData.availablesale;
         updData.maxsupply=bodyData.maxsupply;
         updData.industry=bodyData.industry;
         updData.website=bodyData.website;
         updData.content=bodyData.content;
         var retJsonObj={};    
        Launchpad.findOneAndUpdate(findData, updData,
          {
             new: true
          }, function (err, response) {
        retJsonObj.retMsg = 'Launchpad Details updated successfully';
        retJsonObj.retType = 'success';
        return res.json(retJsonObj);
      })         

}
})


router.post('/applyToken', upload.single('file1'),(req,res)=>{

var bodyData=req.body;
console.log("bodyData",bodyData)
const file = req.file; 

  if (file != "" && file != undefined) {
  Launchpad.find({}, { lauchpadid: 1 }, { sort: { lauchpadid: -1 }, limit: 1 }).then(
      async (latesuser) => {
       var latestId = 1;
        if (
          latesuser &&
          latesuser.length > 0 &&
          latesuser[0].lauchpadid &&
          latesuser[0].lauchpadid > 0
        ) {
          latestId = parseInt(latesuser[0].lauchpadid) + parseInt(1);
        }

          const launchpaddata=new Launchpad({
                userid  :bodyData.userid,
                tokenname:bodyData.tokenname,
                lauchpadid:latestId,
                symbol:bodyData.symbol,
                availablecurrency:bodyData.availablecurrency,
                price:bodyData.price,
                minAmt:bodyData.minamt,
                discount:bodyData.discount,
                availablesale:bodyData.availablesale,
                maxsupply:bodyData.maxsupply,
                industry:bodyData.industry,
                website:bodyData.website,
                content:bodyData.content,
                curimage:file.filename,
                startdate:bodyData.startdate,
                enddate:bodyData.endDate,
                status:"DeActivated",
 
              })

            var retJsonObj={};  
            launchpaddata.save().then( async result=>{

            let checkUser1 = await User.findOne({ "_id": ObjectId(bodyData.userid) });
            var logo = keys.baseUrl + "Logo-small.png";
            var jsonfilter = {
                   identifier: "Apply_token",
                 };
            Emailtemplates.findOne(
            jsonfilter,
            {
              _id: 0,
            },
            function (err, templates) {
              if (templates) {
                if (templates.content) {
                    var templateData = {}
                  templateData = templates;
                  templateData.content = templateData.content.replace(
                    /##templateInfo_name##/g,
                    checkUser1.email
                  );
          var smtpConfig = {
           service: "privateemail",
           auth: {
             user: "helloomneety@gmail.com",
             pass: "Omneety@1234000",
           },
           host: "smtp.gmail.com",
           port: "587",
         };
        var transporter = nodemailer.createTransport(smtpConfig);

        var mailOptions = {
          from: "noreply@doublejack.world", // sender address
          to: checkUser1.email, // list of receivers
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
            }
          );
            retJsonObj.retMsg = 'Launchpad Token Details Created Successfully.Please Contact To Admin Approval';
            retJsonObj.retType = 'success';
            return res.json(retJsonObj);
               }).catch(err => console.log(err,'gggggggggg'));

      })

}else{

   Launchpad.find({}, { lauchpadid: 1 }, { sort: { lauchpadid: -1 }, limit: 1 }).then(
      async (latesuser) => {
       var latestId = 1;
        if (
          latesuser &&
          latesuser.length > 0 &&
          latesuser[0].lauchpadid &&
          latesuser[0].lauchpadid > 0
        ) {
          latestId = parseInt(latesuser[0].lauchpadid) + parseInt(1);
        }

          const launchpaddata=new Launchpad({
               userid  :bodyData.userid,
                tokenname:bodyData.tokenname,
                lauchpadid:latestId,
                symbol:bodyData.symbol,
                availablecurrency:bodyData.availablecurrency,
                price:bodyData.price,
                minAmt:bodyData.minamt,
                discount:bodyData.discount,
                availablesale:bodyData.availablesale,
                maxsupply:bodyData.maxsupply,
                industry:bodyData.industry,
                website:bodyData.website,
                content:bodyData.content,
                startdate:bodyData.startdate,
                enddate:bodyData.endDate,
                status:"DeActivated",
              })


            var retJsonObj={};  
            launchpaddata.save().then(async result=>{


    let checkUser1 = await User.findOne({ "_id": ObjectId(bodyData.userid) });
console.log("checkUser1",checkUser1)
                var logo = keys.baseUrl + "Logo-small.png";
                 var jsonfilter = {
                   identifier: "Apply_token",
                 };
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
                    checkUser1.email
                  );
                  templateData.content = templateData.content.replace(
                    /##templateInfo_appName##/g,
                    keys.siteName
                  );
                  templateData.content = templateData.content.replace(
                    /##templateInfo_logo##/g,
                    logo
                  );
            var smtpConfig = {
    
                    service: "privateemail",
                    auth: {
                      user: "helloomneety@gmail.com",
                      pass: "Omneety@1234000",
                    },
                    host: "smtp.gmail.com",
                    port: "587",
                  };
        var transporter = nodemailer.createTransport(smtpConfig);

        var mailOptions = {
          from: keys.fromName + "<" + keys.fromemail + ">", // sender address
          to: checkUser1.email, // list of receivers
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
            }
          );

              
                  retJsonObj.retMsg = 'Launchpad Token Details Created Successfully.Please Contact To Admin Approval';
                  retJsonObj.retType = 'success';
                  return res.json(retJsonObj);
               }).catch(err => console.log(err,'gggggggggg'));


})
 }


 })

router.post('/launchpadbuy', (req,res)=>{
   var bodyData=req.body;
   console.log("bodyData",bodyData)
  Assets.findOne({
    userId: bodyData.userid,
  }).then((data) => {
    

  })

   var retJsonObj={};
   const launchpadHistory=new LaunchpadHistory({
	        amount:bodyData.amount,
          tokenname:bodyData.tokenname,
	        price:bodyData.price,
	        total:bodyData.total,
	        discount:bodyData.discount,
          youpay:bodyData.youpay,
          userid:bodyData.userid
   });

   launchpadHistory.save().then(result=>{
       retJsonObj.retMsg = 'Launchpad Token Buy Successfully';
        retJsonObj.retType = 'success';
        return res.json(retJsonObj);

   }).catch(err => console.log(err,'gggggggggg'));

})

module.exports = router;