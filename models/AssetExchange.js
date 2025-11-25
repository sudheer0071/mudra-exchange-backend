const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let AssetExchange = new Schema({
    pair:{
        type:String
    },
    first_currency:{
		type:String,
		default:'',
		index:true
	},
    second_currency:{
		type:String,
		default:'',
		index:true
	},
	currency:{
		type: Schema.Types.ObjectId, ref: 'currency', index:true
	},

    single_min_limit:{
        type:String
    },
    single_max_limit:{
        type:String
    },
    full_min_limit:{
        type:String
    },
    full_max_limit:{
        type:String
    },
    trade_fee:{
        type:String
    },
    status:{
        type:String
    }
});

module.exports = mongoose.model('AssetExchange',AssetExchange,'AssetExchange');