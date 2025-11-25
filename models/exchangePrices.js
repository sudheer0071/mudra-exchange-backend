const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let exchangePrices = new Schema({
	pairname:{
		type:String, 
		required:true,
		index: true 
	},
	exchangename:{
		type:String, 
		required:true,
		index: true 
	},
	pair:{
		type: Schema.Types.ObjectId, ref: 'perpetual',
		index:true
	},
	low:{
		type: Number, default: 0,
	},
	high:{
		type: Number, default: 0,
	},
	last:{
		type: Number, default: 0,
	},
	volume:{
		type: Number, default: 0,
		index: true 
	},
	createdAt:{
		type: Date, default: new Date(),
		index: true 
	},
});

module.exports = mongoose.model('exchangePrices',exchangePrices,'exchangePrices');