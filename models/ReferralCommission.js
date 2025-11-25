// import package
import mongoose from "mongoose";

const Schema = mongoose.Schema;

let referralcommission = new Schema({
  percentage: {
    type: String,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    index: true,
  },

  referraluserId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    index: true,
  },

  currencyId: {
    type: Schema.Types.ObjectId,
    ref: "currency",
    index: true,
  },

  currencySymbol: {
    type: String,
  },

  amount: {
    type: String,
  },
  createdDate: {
    type: Date,
    default: new Date(),
  },
  status: {
    type: String,
    default: 1, // 0 - deactive, 1-active
  },
});

const ReferralCommission = mongoose.model(
  "referralcommission",
  referralcommission,
  "referralcommission"
);

export default ReferralCommission;
