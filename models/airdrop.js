// import package
import mongoose from "mongoose";

const Schema = mongoose.Schema;

let airdrop = new Schema({
  tokenamount: {
    type: String,
  },

  email: {
    type: String,
  },

  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    index: true,
  },

  currencyId: {
    type: Schema.Types.ObjectId,
    ref: "currency",
    index: true,
  },

  createdDate: {
    type: Date,
    default: Date.now
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: "admins",
  },
  status: {
    type: String,
    default: 1, // 0 - deactive, 1-active
  },
});

const Airdrop = mongoose.model("airdrop", airdrop, "airdrop");

export default Airdrop;
