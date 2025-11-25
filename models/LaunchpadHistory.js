const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let LaunchpadHistory = new Schema({
	tokenname:{
		type:String,
		required:true,
	},
	amount:{
       type:Number,
		
	},
	total:{
		type:Number,
		required:true,
	},
	youpay:{
		type:Number,
		required:true,
	},
	discount:{
        type:Number,
		required:true,
	},
	userid:{
		type: Schema.Types.ObjectId,
		 ref: 'users'
	},
	created_date:{
		type:Date,
		default: Date.now
	},
});
module.exports = mongoose.model('LaunchpadHistory',LaunchpadHistory,'LaunchpadHistory');
