// import package
import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const stakingOrderSchema = new Schema({
    userId: {
        type: ObjectId,
        required: true,
        ref: 'users'
    },
    currencyId: {
        type: ObjectId,
        required: true,
        ref: 'currency'
    },
    coin: {
        type: String,
        default: '',
    },
    stakeId: {
        type: ObjectId,
        required: true,
        ref: 'staking'
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    type: {
        type: String,
        enum: ['flexible', 'fixed'],
        required: true
    },
    APY: {   // annual percentage yield in percentage
        type: Number,
        default: 0
    },
    totalDateForFlexibleEnd: {   // annual percentage yield in percentage
        type: Number,
        default: 365
    },
    cancelDate: {
        type: Date,
        default: Date.now
    },
    settlementPeriod: {
        type: Number,
        default: 0
    },
    settleStartDate: {
        type: Date,
        default: Date.now
    },
    settleEndDate: {
        type: Date,
        default: Date.now
    },
    duration: {         // In days
        type: Number,
        default: 365
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    redemptionPeriod: {
        type: Number,
        required: true,
        default: 1,
    },
    redemDate: {
        type: Date,
        default: Date.now
    },
    redemStatus: {
        type: String,
        enum: ['active', 'process', 'completed'],
        default: "active"
    }, // close, process, completed , 1-active, 2-process, 3-completed
    status: {
        type: String,
        enum: ['active', 'cancel_user', 'cancel_date'],
        default: 'active'
    }, // 1-active, 2-closedByUser, 3-closedByDate
});

const StakingOrder = mongoose.model('stakingOrder', stakingOrderSchema, 'stakingOrder');

export default StakingOrder