// import package
import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const TradeBotSchema = new Schema({
    pairId: {
        type: ObjectId,
        required: true,
        ref: 'spotpairs',
    },
    side: {
        type: [String],
        enum: ["buy", "sell"],
    },
    buyStartPrice: {
        type: Number,
        required: true,
    },
    buyEndPrice: {
        type: Number,
        required: true,
    },
    sellStartPrice: {
        type: Number,
        required: true,
    },
    sellEndPrice: {
        type: Number,
        required: true,
    },
    startQuantity: {
        type: Number,
        required: true,
    },
    endQuantity: {
        type: Number,
        required: true,
    },
    count: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'deactive'],
        default: 'active'
    },
}, {
    timestamps: true
});

const TradeBot = mongoose.model('tradeBot', TradeBotSchema, 'tradeBot');

export default TradeBot;