const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let stakingfaq = new Schema({
	question:{
		type:String
	},
	answer:{
		type:String,
		required:true,
	},
	created_date:{
		type:Date,
		default: Date.now
	},
});
module.exports = mongoose.model('stakingfaq',stakingfaq,'stakingfaq');