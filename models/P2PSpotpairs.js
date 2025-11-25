const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let P2PSpotpairsSchema = new Schema({

	tiker_root:{
		type:String
		/*required:true,
		index: true */
	},
	transactionfee:{
		type:String,
		default:''
	},
	index_price:{
		type:String,
		default:''   //index price
	},
	mark_price:{
		type:String,
		default:'' //market price
	},

	maxquantity:{
		type:String,
		default:''
	},
	minquantity:{
		type:String,
		default:''
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
	status:{
		type:Number,
		default:0
	}
});

// module.exports = mongoose.model('P2PSpotpairs',P2PSpotpairs,'P2PSpotpairs');

const P2PSpotpairs = mongoose.model("P2PSpotpairs", P2PSpotpairsSchema, 'P2PSpotpairs');

export default P2PSpotpairs;
