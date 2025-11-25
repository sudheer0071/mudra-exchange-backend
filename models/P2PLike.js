const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const P2PLikeSchema = new Schema({
  
    TradeId : {
        type: Schema.Types.ObjectId, ref: 'p2ptradeTable',
            index: true
      },

    userId : {
      type: Schema.Types.ObjectId, ref: 'users',
  		index: true
    },

    likes : {
        type: String,
        default: ""
      },

    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
    }

});
// module.exports = P2PLike = mongoose.model("P2PLike", P2PLikeSchema);

const P2PLike = mongoose.model("P2PLike", P2PLikeSchema, 'P2PLike');

export default P2PLike;
