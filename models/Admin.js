// import package
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

// import lib
import config from "../config";

const Schema = mongoose.Schema;

const RestrictionSchema = new Schema({
  _id: 0,
  // name: {
  //     type: String,
  //     default: ""
  // },
  path: {
    type: String,
    default: "",
  },
  isWriteAccess: {
    type: Boolean,
    default: false,
  },
});

const AdminSchema = new Schema({
  name: {
    type: String,
    default: "",
  },
  email: {
    type: String,
    required: true,
  },
  newemail: {
    type: String,
    default: "",
  },
  newemailstatus: {
    type: Number,
    default: 0,   //1 otp send send old//2 otp send to new
    
  },
  oldotp: {
    type: String,
    default: "",
  },
  newotp: {
    type: String,
    default: "",
  },
  password: {
    type: String,
    required: true,
  },
  mobileno: {
    type: String,
    // required: true,
  },
  newmobileno: {
    type: String,
    default: "",
  },
  forgotPassword: {
    type: String,
    default: "",
  },
  newmobilenostatus: {
    type: Number,
    default: 0,   //1 otp send send old//2 otp send to new
    
  },
  role: {
    type: String,
    enum: ["Admin", "subadmin","superadmin"], // super admin access all, admin - restricted
  },

  User: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  UserBalance: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  Currency: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  PriceConversation: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  airdropHistory: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  SpotPair: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  SideSetting: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  FaqCategory: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  Faq: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  SupportCategory: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  Support: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  EmailTemplate: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  CmsPage: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  Kyc: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  WithdrawList: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  DepositList: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  ContactUs: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  Newsletter: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  Announcement: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  Launchpad: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  LaunchpadCms: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  Language: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  SpotOrderHistory: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  SpotTradeHistory: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  TradingBot: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  p2ptradehistory: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  p2pchathistory: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  p2pdisputelist: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  p2pcommissionhistory: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  stackingorder: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  stackingsettlement: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  airdrop: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  refferalcommisonhistory: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  deleteuserList: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  feeandrefferal: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  priceconversion: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  p2ppair: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  BlogCategory: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  BlogArticle: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  Staking: {
    type: Boolean,
    default: false, // super admin access all, admin - restricted
  },
  restriction: [RestrictionSchema],
  google2Fa: {
    secret: {
      type: String,
      default: "",
    },
    uri: {
      type: String,
      default: "",
    },
  },

  google: {
    type: String,
    default: "Disabled",
  },
  googlesecretcode: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

AdminSchema.methods.generateJWT = function (payload) {
  var token = jwt.sign(payload, config.secretOrKey);
  return `Bearer ${token}`;
};

const Admin = mongoose.model("admins", AdminSchema);

export default Admin;
