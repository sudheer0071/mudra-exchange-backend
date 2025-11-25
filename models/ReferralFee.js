// import package
import mongoose from "mongoose";

const Schema = mongoose.Schema;

let referralfee = new Schema({
  percentage: {
    type: String,
  },
  currencyId: {
    type: Schema.Types.ObjectId,
    ref: "currency",
    index: true,
  },
  usdtamount: {
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

const ReferralFee = mongoose.model("referralfee", referralfee, "referralfee");

export default ReferralFee;
