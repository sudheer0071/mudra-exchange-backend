// import package
import mongoose from "mongoose";

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const stakingSettleSchema = new Schema({
  userId: {
    type: ObjectId,
    ref: "users",
    required: true,
  },
  currencyId: {
    type: ObjectId,
    ref: "currency",
    required: true,
  },
  coin: {
    type: String,
    default: "",
  },
  stakeOrderId: {
    type: ObjectId,
    ref: "stakingOrder",
    required: true,
  },
  amount: {
    type: Number,
    default: 0,
  },
  days: {
    type: Number,
    default: 0,
  },
  settleDate: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ["interest", "redemption"],
  },

  StakeType: {
    type: String,
  },
});

const stakingSettle = mongoose.model(
  "stakingSettle",
  stakingSettleSchema,
  "stakingSettle"
);

export default stakingSettle;
