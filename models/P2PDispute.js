const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const P2PDisputeSchema = new Schema({
  
    TradeId : {
        type: Schema.Types.ObjectId, ref: 'p2ptradeTable',
            index: true
      },

      orderbookId : {
        type: Schema.Types.ObjectId, ref: 'p2porderbooks',
            index: true
      },
      
      seller_id : {
      type: Schema.Types.ObjectId, ref: 'users',
  		index: true
    },
    buyer_id : {
      type: Schema.Types.ObjectId, ref: 'users',
  		index: true
    },


    raised_by: {
        type: String,
        default: ""
    },

    attachment: {
        type: String,
        default: ""
    },

    status:{
		type:String,
		 default :"0" // 0 - pending , 1 - resolved
    },
    
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }

});
//module.exports = P2PDispute = mongoose.model("P2PDispute", P2PDisputeSchema,"P2PDispute");
module.exports = mongoose.model("P2PDispute", P2PDisputeSchema, "P2PDispute");
// const P2PDispute = mongoose.model("P2PDispute", P2PDisputeSchema, 'P2PDispute');

// export default P2PDispute;
