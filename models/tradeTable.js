const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ObjectId = Schema.ObjectId;

var filledSchema = new Schema({
	pairId: {
		type: ObjectId,
		ref: 'perpetual'
	},
	sellUserId: {
		type: ObjectId,
		ref: 'users'
	},
	buyUserId: {
		type: ObjectId,
		ref: 'users'
	},
	userId: {
		type: ObjectId,
		ref: 'users'
	},
	sellOrderId: {
		type: ObjectId,
		ref: 'tradeTable'
	},
	buyOrderId: {
		type: ObjectId,
		ref: 'tradeTable'
	},
	uniqueid: {
		type: String,
		default: ''
	},
	price: {
		type: Number,
		default: 0
	},
	filledQuantity: {
		type: Number,
		default: 0
	},
	Type: {
		type: String
	},
	orderCost: {
		type: Number,
		default: 0
	},
	Fees: {
		type: Number,
		default: 0
	},
	orderValue: {
		type: String,
		default: 0
	},
	createdAt: {
		type: Date,
		default: Date.now
	},





	"firstCurrency": { type: String, default: '', index: true },
	"secondCurrency": { type: String, default: '', index: true },
	"pairname": { type: String, index: true },
	"forced_liquidation": { type: Boolean, default: false },


	"status": { type: String, index: true },
	"position_status": { type: String, default: '1' },
	"positionFilled": { type: Number, default: 0 },
	beforeBalance: { type: String, default: 0 },
	afterBalance: { type: String, default: 0 },
	beforebonusBalance: { type: String, default: 0 },
	afterbonusBalance: { type: String, default: 0 },



});


let tradeTable = new Schema({
	pairId: {
		type: ObjectId,
		ref: 'perpetual'
	},
	pairName: {
		type: String,
		default: ''
	},
	userId: {
		type: ObjectId,
		ref: 'users'
	},
	firstCurrencyId: {
		type: ObjectId,
		required: true,
		ref: 'currency'
	},
	firstCurrency: {
		type: String,
		required: true,
	},
	secondCurrencyId: {
		type: ObjectId,
		required: true,
		ref: 'currency'
	},
	secondCurrency: {
		type: String,
		required: true,
	},
	buyorsell: {
		type: String,
		enum: ['buy', 'sell']
	},
	orderType: {
		type: String,
		enum: ['limit', 'market'],
	},
	price: {
		type: Number,
		required: true,
	},
	quantity: {
		type: Number,
		required: true,
	},
	orderCost: {
		type: Number,
		default: 0,
	},
	orderValue: {
		type: Number,
		default: 0
	},
	leverage: {
		type: Number,
		default: 0
	},
	liquidityPrice: {
		type: Number,
		default: 0
	},
	filledQuantity: {
		type: Number,
		default: 0
	},
	takerFee: {
		type: Number,
		default: 0,   //percentage fee  
	},
	positionQuantity: {
		type: Number,
		default: 0
	},
	positionStatus: {
		type: String,
		enum: ['open', 'closed'],
		default: 'closed'
	},
	takeProfitPrice: {
		type: Number,
		default: 0
	},
	stopLossPrice: {
		type: Number,
		default: 0
	},
	isProfitLoss: {
		type: Number,
		default: 0
	},
	orderDate: {
		type: Date,
		default: Date.now()
	},
	filled: [filledSchema],
	typeTIF: {		// Time In Force Type
		type: String,
		enum: ["GTC", "IOC", "FOK"],
		default: 'GTC'     //  GTC - Good Till Cancelled, IOC - Immediate or Cancel, FOK - Fill or Kill
	},
	status: {
		type: String,
		required: true,
		enum: ['open', 'pending', 'completed', 'cancel', 'conditional'],
		default: 'open', //0-new, 1-completed, 2-partial, 3- Cancel, 4- Conditional
	},

	/* ------------------------------ */


	trigger_price: {
		type: Number,
		default: 0
	},





	postOnly: {
		type: Boolean,
		default: false
	},
	reduceOnly: {
		type: Boolean,
		default: false
	},
	beforeBalance: {
		type: String,
		default: 0
	},
	afterBalance: {
		type: String,
		default: 0
	},
	beforebonusBalance: {
		type: String,
		default: 0
	},
	afterbonusBalance: {
		type: String,
		default: 0
	},

	trigger_type: {
		type: String,
		default: '',
		index: true
	},
	orderDate: {
		type: Date,
		default: Date.now()
	},
	filledAmount: {
		type: Number,
		default: 0
	},

	pairid: {
		type: String,
		default: 0
	},
	stopstatus: {
		type: String,
		default: '0',     // 0-Conditional, 1- stop/takeprofit, trailing stop , 2-Active
		index: true
	},
	trigger_ordertype: {
		type: String,
		default: null,
		index: true
	},
	trailstop: {
		type: String,
		default: '0', //true -  Trail stop , False- Non trail stop
		index: true
	},
	forced_liquidation: {
		type: Boolean,
		default: '0', //true -  Trail stop , False- Non trail stop
		index: false
	},
	trailstopdistance: {
		type: Number,
		default: 0,
	},
	btcprice: {
		type: String,
		default: 0,
	},

	bybitorderid: {
		type: String,
		default: ""
	},
	bybittype: {
		type: Boolean,
		default: false
	},
});



module.exports = mongoose.model('perpetualorder', tradeTable, 'perpetualorder');
