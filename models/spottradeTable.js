const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

var filledSchema = new Schema({
  pairId: {
    type: ObjectId,
    ref: "spotpairs",
    index: true,
  },
  userId: {
    type: ObjectId,
    ref: "users",
  },
  buyUserId: {
    type: ObjectId,
    ref: "users",
  },
  sellUserId: {
    type: ObjectId,
    ref: "users",
  },
  sellOrderId: {
    type: ObjectId,
    ref: "spottradeTable",
  },
  buyOrderId: {
    type: ObjectId,
    ref: "spottradeTable",
  },
  uniqueId: {
    type: String,
    default: 0,
  },
  price: {
    type: Number,
    default: 0,
  },
  filledQuantity: {
    type: Number,
    default: 0,
  },
  orderValue: {
    type: Number,
    default: 0,
  },
  Type: {
    type: String,
  },
  Fees: {
    type: Number,
    default: 0,
  },
  isMaker: {
    type: Boolean,
    default: false,
  },
  OwnToken: {
    type: String,
    default: "No",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  /* ----------------------------- */
  filledAmount: Number,
  pairName: {
    type: String,
  },
  firstCurrency: { type: String, default: "", index: false },
  secondCurrency: { type: String, default: "", index: false },

  status: { type: String, index: true },
  beforeBalance: { type: String, default: 0 },
  afterBalance: { type: String, default: 0 },
});

let spottradeTable = new Schema(
  {
    userId: {
      type: ObjectId,
      required: true,
      ref: "users",
    },
    pairId: {
      type: ObjectId,
      required: true,
      ref: "spotpairs",
      index: true,
    },
    pairName: {
      type: String,
      required: true,
      default: "",
    },
    firstCurrencyId: {
      type: ObjectId,
      required: true,
      ref: "currency",
    },
    firstCurrency: {
      type: String,
      required: true,
      default: "",
    },
    secondCurrencyId: {
      type: ObjectId,
      required: true,
      ref: "currency",
    },
    secondCurrency: {
      type: String,
      required: true,
      default: "",
    },
    buyorsell: {
      type: String,
      default: "", //buy or sell
      index: true,
    },
    orderType: {
      type: String,
      enum: ["limit", "market", "stop_limit"],
    },
    price: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },

    tokenfee: {
      type: Number,
      default: 0,
    },

    filledQuantity: {
      type: Number,
      default: 0,
    },
    orderValue: {
      type: Number,
      default: "",
    },

    beforeBalance: {
      type: String,
      default: 0,
    },
    afterBalance: {
      type: String,
      default: 0,
    },
    stopPrice: {
      type: Number,
      default: 0,
    },
    conditionalType: {
      type: String,
      enum: ["", "equal", "greater_than", "lesser_than"],
      default: "",
    },
    orderDate: {
      type: Date,
      default: Date.now(),
    },
    filled: [filledSchema],
    status: {
      type: String,
      required: true,
      enum: [
        "open",
        "pending",
        "completed",
        "cancel",
        "conditional",
        "idle",
        "wait",
      ],
      default: "open", //0-new, 1-completed, 2-partial, 3- Cancel, 4- Conditional
      index: true,
    },

    botstatus: {
      type: String,
      default: "",
    },
    wazirixOrderId: {
      type: Number,
      default: 0,
    },

    postOnly: {
      type: Boolean,
      default: false,
    },
    reduceOnly: {
      type: Boolean,
      default: false,
    },

    trigger_type: {
      type: String,
      default: "",
      index: false,
    },
    timeinforcetype: {
      type: String,
      default: "", // Goodtillcancelled FOK Immediateorcancel
    },

    stopstatus: {
      type: String,
      default: "0", // 0-Conditional, 1- stop/takeprofit, trailing stop , 2-Active
      index: false,
    },
    trigger_ordertype: {
      type: String,
      default: null,
      index: false,
    },

    spotType: {
      type: String,
      default: "", // [ Lessthan or Greaterthan --( StopLimit)] , [ none -- (Not StopLimit)]
    },
    trailstop: {
      type: String,
      default: "0", //true -  Trail stop , False- Non trail stop
      index: false,
    },
    trailstopdistance: {
      type: Number,
      default: 0,
    },
    liquidityId: {
      type: String,
      default: "",
    },
    liquidityType: {
      type: String, // binance, wazrix, adminliquidity
      default: "",
    },
    isLiquidity: {
      type: Boolean,
      default: false,
    },
    markuppercentage: {
      type: String,
      default: "", //mark price
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "spottradeTable",
  spottradeTable,
  "spottradeTable"
);
