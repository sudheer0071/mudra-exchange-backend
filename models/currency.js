const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let CurrencySchema = new Schema(
  {
    currencyName: {
      type: String,
      default: "",
    },
    currencySymbol: {
      type: String,
      unique: false,
      required: true,
      index: false
    },
    type: {
      type: String,
      enum: ["crypto", "token", "fiat"],
      default: "crypto", // crypto, token, fiat
    },
    withdrawFeeType: {
      type: String,
      enum: ["percentage", "flat"],
      default: "percentage",
    },
    withdrawFee: {
      type: Number, //percentage
      default: 0,
    },
    withdrawFeeFlat: {
      type: Number, //percentage
      default: 0,
    },
    withdrawLimit: {
      type: Number, //percentage
      default: 100,
    },
    depositFee: {
      type: Number, //percentage
      default: 0,
    },
    minimumdeposit: {
      type: Number, //percentage
      default: 0,
    },
    gateWay: {
      type: String, //percentage
      default: "CoinPayment",
    },
    CoinpaymetNetWorkFee: {
      type: Number, //percentage
      default: 0.1,
    },
    minimumWithdraw: {
      type: Number,
      default: 0,
    },
    currencyImage: {
      type: String,
      default: "",
    },

    bankDetails: {
      //fiat
      bankName: {
        type: String,
        default: "",
      },
      accountNo: {
        type: String,
        default: "",
      },
      holderName: {
        type: String,
        default: "",
      },
      bankcode: {
        type: String,
        default: "",
      },
      country: {
        type: String,
        default: "",
      },
    },
    tokenType: {
      // token
      type: String,
      enum: ["", "erc20", "trc20","beb20"],
      default: "",
    },
    minABI: {
      // token
      type: String,
      default: "",
    },
    contractAddress: {
      // token
      type: String,
      default: "",
    },
    decimals: {
      // token
      type: Number,
      default: 0,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "deactive"],
      default: "active",
    },

    displaypriority: {
      type: Number,
      default: 4,
    },
    /* ------------------------------------ */
    fee: {
      type: Number,
      default: 0,
    },

    usdtamount: {
      type: Number,
      default: 0,
    },

    minimumDeposit: {
      type: Number,
      default: 0,
    },
    burnFee: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    validateBeforeSave:false
  }
);
// Disable validation before saving
CurrencySchema.set('validateBeforeSave', false);

const Currency = mongoose.model("currency", CurrencySchema, "currency");

export default Currency;
