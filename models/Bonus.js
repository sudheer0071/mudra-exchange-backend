const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Bonus = new Schema({
   userId:{
        type: Schema.Types.ObjectId, ref: 'users',
        index: true
    },
    bonus_amount:{
        type:String
    },
    type:{
        type:String,
        default:'0' //0-signup bonus, 1 referbonus, 2 deposit bonus  , 3- Social media promotion  
    },
    createdDate:{
        type:Date,
        default:new Date()   
    },
    referId:{
        type: Schema.Types.ObjectId, ref: 'users',
        index: true
    },
    depositamount:{
        type:String,
        default:0
    },

});

module.exports = mongoose.model('Bonus', Bonus, 'Bonus');