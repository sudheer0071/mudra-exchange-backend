const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let AssetExchangeHistory = new Schema({

    from_coin: {
        type: String,
        default: '',
        index: true
    },
    to_coin: {
        type: String,
        default: '',
        index: true
    },
    input_amount: {
        type: String
    },
    time: {
        type: Date,
        default: Date.now
    },
    transaction_id: {
        type: String
    },
    receiving_amount: {
        type: String
    },
    userId:{
		type: Schema.Types.ObjectId, ref: 'users',
	},

});

module.exports = mongoose.model('AssetExchangeHistory', AssetExchangeHistory, 'AssetExchangeHistory');