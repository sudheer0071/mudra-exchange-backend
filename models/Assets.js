const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Assets = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'users',
		index: true
	},
	currency: {
		type: Schema.Types.ObjectId,
		ref: 'currency'
	},
	currencySymbol: {
		type: String,
		default: '',
		index: true
	},
	currencyAddress: {
		type: String,
		default: '',
	},
	privateKey: {
		type: String,
		default: '',
	},
	alt_tag: {
		type: String,
		default: '',
	},
	tempcurrency: {
		type: Number,   //bonus balance added in usd
		default: '0'
	},
	balance: {
		type: Number,
		default: 0
	},
	derivativeWallet: {
		type: Number,
		default: 0
	},
	spotwallet: {
		type: Number,   //bonus balance added in usd
		default: 0
	},
	p2pbalance:{
		type:Number,
		default:0
	},
	p2pholdingbalance:{
		type:Number,
		default:0
	},
	p2pwallet:{
		type:Number,
		default:0
	},
		blockNo: {
		type: Number,
		default: 0
	}
});

module.exports = mongoose.model('Assets', Assets, 'Assets');
