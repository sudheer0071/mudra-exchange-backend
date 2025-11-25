const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let AdminRevenue = new Schema({
  fee: {
    type: Number,
    default: 0,
  },
  amount: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: "",
  },
  currency_type: {
    type: String,
    default: "",
  },

  type: {
    type: String,
    default: "",
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: "P2POrderbook",
    index: true,
  },
  tradeId: {
    type: Schema.Types.ObjectId,
    ref: "P2PTradeTable",
    index: true,
  },
  created_date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AdminRevenue", AdminRevenue, "AdminRevenue");
