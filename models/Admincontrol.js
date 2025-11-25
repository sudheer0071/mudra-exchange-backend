const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const AdmiSchema = new Schema({
    name: {
        type: String,
        default: ""
      },
      email: {
        type: String,
        // required: true
      },
      password: {
        type: String,
        required: true
      },
      moderator:{
        type:String,
        default:'2' //0-normal user, 1-moderator 2-admin, 
      },
      phonenumber: {
        type: String,
        default: ""
      },
      otp: {
        type: String,
        default: ""
      },
      otptime: {
        type: Date,
        default: ''
      },
      patternlock:{
        type: String
      },
      maintanancestate: {
        type: Boolean,
        default: false    //false- disable, true- enable maintanancestate
      },
})

module.exports = mongoose.model('AdmiSchema',AdmiSchema,'AdmiSchema');