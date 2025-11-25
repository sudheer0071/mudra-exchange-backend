const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let request = new Schema({
	requestType: {
		type: String, default: ''
	},
	receiveraddress: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'address'
	},
	receiverCryptoAddress: {
		type: String,
		default: ''
	},
	userId:
	{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'users'
	},
	cryptoType: {
		type: String, default: ''
	},
	transactionId: {
		type: String, default: ''
	},
	transferamount: {
		type: Number, default: 0
	},
	existingBalance: {
		type: Number, default: 0
	},
	finalamount: {
		type: Number, default: 0
	},
	tagid: {
		type: String, default: ''
	},
	status: {
		type: String, default: '', // Confirm,Reject,Pending,Cancel
	},
	confirmed: {
		type: Boolean, default: false
	},
	created_date: {
		type: Date,
		default: Date.now
	},
});

module.exports = mongoose.model('request', request, 'request');
