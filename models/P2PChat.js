const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const P2PChatSchema = new Schema({
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

  Sender_userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    index: true,
  },

  Receiver_userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    index: true,
  },

  message: {
    type: String,
    default: "",
  },

  readstatus: {
    type: Boolean,
    default: false,
  },
  attachment: {
    type: String,
    default: "",
  },

  status: {
    type: String,
    default: "1", // 1 for Active
  },

  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  cancelReason: {
    type: String,
    default: "",
  },

  admin: {
    type: Boolean,
    default: false,
  },
});
// module.exports = P2PChat = mongoose.model("P2PChat", P2PChatSchema);

const P2PChat = mongoose.model("P2PChat", P2PChatSchema, "P2PChat");

export default P2PChat;
