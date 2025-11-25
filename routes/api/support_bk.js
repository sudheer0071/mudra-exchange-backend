const express = require('express');
const router = express.Router();
const Support = require('../../models/support');
const Emailtemplates = require('../../models/emailtemplate');
const nodemailer = require('nodemailer');
const multer = require('multer');


router.get('/test', (req, res) => {
  res.json({statue:"success"});
});

router.post('/support_data', (req, res) => {
  console.log("awsedrtfgyuhjikol");
   Support.find({}).then(support_data => {
    console.log(support_data,'support_data');
        if (support_data) {
            return res.status(200).send(support_data);
        }
    });
});
router.post('/contact-data1', (req, res) => {
    Contact.find({}).then(contact => {
        if (contact) {
            return res.status(200).send(contact);
        }
    });
});
/*router.post('/contact-delete', (req, res) => {
    Contact.deleteOne({ _id: req.body._id}).then(contact => {
        if (contact) {
            return res.status(200).json({message: 'Contact deleted successfully. Refreshing data...', success: true})
        }
    });
});

router.post('/replycontact', (req, res) => {
    var id= req.body._id
    var contactemail = "";
    var message = "";
    async.waterfall([
        function (done) {
        Contact.findById(id).then(contact => {
            if (contact) {
                contactemail = contact.email; 
                message = contact.message; 
                done();
            }
        })
      },
      function (done) {
        var smtpConfig = {
          service: keys.serverName,
          auth: {
              user: keys.email,
              pass: keys.password
          }
       };
       var transporter = nodemailer.createTransport(smtpConfig);

       var mailOptions = {
          from: keys.fromName+ '<'+keys.email +'>', // sender address
          to: contactemail, // list of receivers
          subject: "Thanks for Contact us", // Subject line
          html: req.body.reply // html body
       };
       console.log(mailOptions);
       transporter.sendMail(mailOptions, function(error, info){
          if(error)
          {
             return console.log(error);
          }
          else
          {
            return res.status(200).json({message: 'Reply Mail sent to user',success:true})
          }
       });
      }
    ], function (err) {
    });
});
    */
    

  /*router.post('/user-changestatus', function(req,res){    
    var pdata =  req.body;  
    console.log(pdata,'pdata'); 
      User.findOne({_id:pdata},{status:1}).then(results => {   
          console.log(results,'results');
      try { 
          
      if(results.status==1) {  
        var newstatus = 0; 
        var title = 'Deactivated'   
      }
          else { 
             var newstatus = 1; 

            var title = 'Activated'
          } 
           User.findOneAndUpdate({"_id": pdata},{"$set": {"status": newstatus}},{new: true}).exec(function(uperr, resUpdate){  
           console.log(resUpdate,'resUpdate');       
              if (!uperr) {
                console.log(resUpdate); 
                 res.json({'status':true,message:"Page status "+title+" successfully"})
              }
              else { 
                  res.json({'status':false,message:"Some error was occurred while updating user status"})
              } 
     });
      } catch(err) { 
          console.log(err,'err');
         res.json({'status':false,message:"Some error was occurred while updating user status"+err})
      }

      }); 


}); */

module.exports = router;