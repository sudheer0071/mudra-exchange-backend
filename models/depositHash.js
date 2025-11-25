// import package
import mongoose from "mongoose";
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const depositHashSchema = new Schema({
    coin: {
        type: String,
        default: "",
        index: true,
    },
    currencyId: {
        type: ObjectId,
        ref: "currency",
        index: true,
    },
    hash: {
        type: String,
        default: "",
    },
    tokenType: {
        type: String,
        default: "",
    },
    amount: {
        type: Number,
        default: 0,
    },
    userAddress: {
        type: String,
        default: "",
    },
    network: {
        type: String,
        default: "",
    },
    userId: {
        type: ObjectId,
        index: true,
    },
    assetEntry: {
        type: Boolean,
        index: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const DepositHash = mongoose.model("depositHash", depositHashSchema, "depositHash");
export default DepositHash;