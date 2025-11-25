// import package
import mongoose from "mongoose";

const Schema = mongoose.Schema;

let feesowntoken = new Schema({
  percentage: {
    type: String,
  },
  currencyId: {
    type: Schema.Types.ObjectId,
    ref: "currency",
    index: true,
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

const FeesOwnToken = mongoose.model(
  "feesowntoken",
  feesowntoken,
  "feesowntoken"
);

export default FeesOwnToken;
