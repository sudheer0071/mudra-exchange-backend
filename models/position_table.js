const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let position_table = new Schema({

	pairname:{
		type:String,
		index: true
	},
	pair : {
	type: Schema.Types.ObjectId, ref: 'perpetual'
	},
	userId : {
	type: Schema.Types.ObjectId, ref: 'users'
	},
	closing_direction:{
		type:String,
	},
	quantity:{
		type:Number,
		default:0
	},
	entry_price:{
		type:Number,
		default:0
	},
	exit_price:{
		type:Number,
		default:0
	},
	profitnloss:{
		type:Number,
		default:0
	},
	exit_type:
	{
		type:String,
		default:"Trade"
	},
	createdDate:{
		type:Date,
		default:Date.now
	},
	beforeBalance        : { type: String, default : 0},
  	afterBalance         : { type: String, default : 0},
  	beforebonusBalance   : { type: String, default : 0},
  	afterbonusBalance    : { type: String, default : 0},
  	orderCost            : { type: String, default : 0},

});

module.exports = mongoose.model('position_table',position_table,'position_table');