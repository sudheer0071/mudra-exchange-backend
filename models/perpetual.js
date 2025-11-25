const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;


let perpetualSchema = new Schema({
	firstCurrencyId: {
		type: ObjectId,
		required: true,
		ref: 'currency'
	},
	firstCurrencySymbol: {
		type: String,
		required: true,
		default: '',
	},
	firstFloatDigit: {
		type: Number,
		default: 8
	},
	secondCurrencyId: {
		type: ObjectId,
		required: true,
		ref: 'currency'
	},
	secondCurrencySymbol: {
		type: String,
		required: true,
		default: '',
	},
	secondFloatDigit: {
		type: Number,
		default: 8
	},
	maker_rebate: {
		type: Number,
		default: 0
	},
	taker_fees: {
		type: Number,
		default: 0
	},
	last: {
		type: Number,
		default: 0
	},
	markPrice: {
		type: Number,
		default: 0
	},
	low: {
		type: Number,
		default: 0
	},
	high: {
		type: Number,
		default: 0
	},
	firstVolume: {
		type: Number,
		default: 0
	},
	secondVolume: {
		type: Number,
		default: 0
	},
	changePrice: {
		type: Number,
		default: 0
	},
	change: {
		type: Number,
		default: 0
	},
	maxQuantity: {
		type: Number,
		default: 0
	},
	minQuantity: {
		type: Number,
		default: 0
	},
	minPricePercentage: {
		type: Number,
		default: 0
	},
	maxPricePercentage: {
		type: Number,
		default: 0
	},
	maintenanceMargin: {
		type: Number,
		required: true,   //in percentage
	},
	botstatus: {
		type: String,
		enum: ['off'],
		default: "off"	// off
	},
	status: {
		type: String,
		enum: ['active', 'deactive'],
		default: "active",  //active, deactive
	},

	// --------------------

	tiker_root: {
		type: String
		/*required:true,
		index: true */
	},
	expiry_date: {
		type: String,
		default: 'Perpetual Contracts'
	},
	initial_margin: {
		type: String,
		//required: true,   //in percentage
		//index: true
	},
	interest_base_symbol: {
		type: String,
		default: ''
	},
	interest_quote_symbol: {
		type: String,
		default: ''
	},
	funding_premium_symbol: {
		type: String,
		default: ''
	},

	funding_rate: {
		type: String,
		default: ''
	},
	leverage: {
		type: String,
		default: ''
	},

	funding_interval: {
		type: String,
		default: ''
	},
	next_funding: {
		type: String,
		default: ''
	},
	index_price: {
		type: String,
		default: ''   //index price
	},
	mark_price: {
		type: String,
		default: '' //market price
	},
	adl: {
		type: String,
		default: 'enable'
	},
	mark_method: {
		type: String,
		default: ''
	},
	risk_limit: {
		type: String,
		default: ''
	},
	risk_step: {
		type: String,
		default: ''
	},
	open_interest: {
		type: String,
		default: ''
	},
	turnover: {
		type: String,
		default: ''
	},
	turnover: {
		type: String,
		default: ''
	},
	total_volume: {
		type: String,
		default: ''
	},
	contract_size: {
		type: String,
		default: ''
	},
	minpriceincrement: {
		type: String,
		default: ''
	},
	maxpriceincrement: {
		type: String,
		default: ''
	},
	maxquantity: {
		type: String,
		default: ''
	},
	minquantity: {
		type: String,
		default: ''
	},
	minmargin: {
		type: String,
		default: ''
	},
	lotsize: {
		type: String,
		default: 1
	},
	first_currency: {
		type: String,
		default: '',
		index: true
	},
	second_currency: {
		type: String,
		default: '',
		index: true
	},
	dailyinterest: {
		type: String,
		default: 0
	},
	total_volume: {
		type: String,
		default: '0'
	},
	liq_users: {
		type: String,
		default: '0',   //liquidating users
		index: true
	}
});

module.exports = mongoose.model('perpetual', perpetualSchema, 'perpetual');