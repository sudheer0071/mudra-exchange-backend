const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const P2PFeedbackSchema = new Schema({

  TradeId: {
    type: Schema.Types.ObjectId,
    ref: "p2ptradeTable",
    index: true,
  },

  orderbookId: {
    type: Schema.Types.ObjectId,
    ref: "p2porderbooks",
    index: true,
  },

  from_userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    index: true,
  },

  to_userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    index: true,
  },

  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    index: true,
  },
  
  satisfy: {
    type: Number,
    default: 1, // 1- Yes 2 -No 3 - No Comments
  },

  likes: {
    type: Number,
    default: 1, // 1- Yes 2 -No 3 - No Comments
  },

  ratings: {
    type: Number,
    default: 1, // 1- Positive 2 -Negative - No Comments
  },

  comments: {
    type: String,
  },

  status: {
    type: Number,
    default: 0,
  },

  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
  },
});

// module.exports = P2PFeedback = mongoose.model("P2PFeedback", P2PfeedbackSchema);

const P2PFeedback = mongoose.model("P2PFeedback", P2PFeedbackSchema, 'P2PFeedback');

export default P2PFeedback;
