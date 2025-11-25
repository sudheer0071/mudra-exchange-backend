const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let FundingHistory = new Schema({
	pair:{
		type: Schema.Types.ObjectId, ref: 'perpetual',
		index: true
	},
	userId:{
		type: Schema.Types.ObjectId, ref: 'users',
		index: true
	},
	pairname:{
		type: String, default: '',
		index: true
	},
	quantity:{
		type: String, default: '',
		index: true
	},
	price:{
		type: String, default: '',
		index: true
	},
	order_value:{
		type: String, default: '',
		index: true
	},
	feerate:{
		type: String, default: '',
		index: true
	},
	feepaid:{
		type: String, default: '',
		index: true
	},
	type:{
		type: String, default: '',  //paid / received
		index: true
	},
	createdDate:{
		type: Date, default: new Date(),  //paid / received
		index: true
	}
});

module.exports = mongoose.model('FundingHistory',FundingHistory,'FundingHistory');
