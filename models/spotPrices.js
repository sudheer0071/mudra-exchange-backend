const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let spotPrices = new Schema({
	pairname:{
		type:String, 
		required:true,
		index: true 
	},
	pair:{
		type: Schema.Types.ObjectId, ref: 'perpetual',
		
	},
	price:{
		type: Number, default: 0,
	},
	createdAt:{
		type: Date, default: new Date(),
		index: true 
	},
});

module.exports = mongoose.model('spotPrices',spotPrices,'spotPrices');