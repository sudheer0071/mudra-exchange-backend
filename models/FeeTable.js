const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let FeeTable = new Schema({
    firstlevel: {
        type:String
    },
    minamount:{
        type:String
    },
    signup_bonus:{
        type:String,
        default:'0'    
    },
    trade_bonus:{
        type:String,
        default:'0'    
    },
    deposit_bonus:{
        type:String,
        default:'0'    
    },
    promo_bonus:{
        type:String,
        default:'0'    
    }

});

module.exports = mongoose.model('FeeTable', FeeTable, 'FeeTable');