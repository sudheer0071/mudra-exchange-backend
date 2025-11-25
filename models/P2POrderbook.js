const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const P2POrderBookSchema = new Schema({

  trade_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "p2ptradeTable",
  },

  from_userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },

  to_userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },

  firstCurrency: {
    type: String,
    default: "",
    index: true,
  },

  secondCurrency: {
    type: String,
    default: "",
    index: true,
  },

  fiat_amount: {
    type: Number,
    default: 0,
  },

  crypto_amount: {
    type: Number,
    default: 0,
  },

  price: {
    type: Number,
    default: 0,
  },

  BuyorSell: {
    type: String,
    default: "", //Buy or Sell
  },
  trade_fee_percentage: {
    type: Number,
    default: 0,
  },
  trade_fee: {
    type: Number,
    default: 0,
  },
  status: {
    type: Number,
    default: 0, // 0- Open 1 -Paid 2 - Cancelled  3 - Dispute 4 - Completed 5 - Closed
  },

  dispute_status: {
    type: String,
    default: 0, // 1-Completed
  },

  start_time: {
    type: Date,
    default: Date.now,
  },

  end_time: {
    type: Date,
  },

  created_date: {
    type: Date,
    default: Date.now,
  },

 updated_date: {
    type: Date,
  },
  
});

// module.exports = Transaction = mongoose.model("P2POrderbook", P2POrderBookSchema);

module.exports = mongoose.model("P2POrderbook", P2POrderBookSchema, "P2POrderbook");


// const P2POrderbook = mongoose.model("P2POrderbook", P2POrderBookSchema, 'P2POrderbook');

// export default P2POrderbook;