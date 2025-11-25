// import package
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// import lib
import config from '../config/index';

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    default: "",
  },
  lastname: {
    type: String,
    default: "",
  },
  email: {
    type: String,
    // required: true
  },
  randomaddress: {
    type: String,
    default: "",
  },
  airdropuser: {
    type: String,
    default: "false"
  },
  userid: {
    type: String,
  },
  password: {
    type: String,
    // required: true,
  },
  mobileno: {
    type: String,
    default: "",
  },
  phonenumber: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "",
  },

  address2: {
    type: String,
    default: "",
  },
  refferalcount: {
    type: Number,
    default: 0,
  },
  addressbtc: {
    type: String,
    default: "",
  },
  userid: {
    type: Number,
    default: "",
  },
  refid: {
    type: String,
    default: "",
  },
  qrCode: {
    type: String,
    default: "",
  },
  refferaltotalperson:   {
    type: Number,
    default: 0,
  },

  googletwofastatus: {
    type: String,
    default: 'Disabled'
  },
  google2Fa: [
    {
      uri: {
        type: String,
        default: "",
      },
      secret: {
        type: String,
        default: "",
      },
      qr: {
        type: String,
        default: "",
      },
      fa2code: {
        type: String,
        default: "",

      },
    }
  ],

  country: {
    type: String,
    default: "",
  },
  city: {
    type: String,
    default: "",
  },
  pincode: {
    type: String,
    default: "",
  },
  otp: {
    type: String,
    default: "",
  },
  otptime: {
    type: Date,
    default: "",
  },
  otpstatus: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    default: "user",
  },
  facebookId: {
    type: String,
    default: "",
  },
  googleId: {
    type: String,
    default: "",
  },
  active: {
    type: String,
    default: "Not Activated",
  },
  status: {
    type: String,
    default: 1, //1-Completed
  },
  kyc: [
    {
      idprooffrond: {
        type: String,
        default: 1,
      },
      idproofback: {
        type: String,
        default: 1, //1-Completed
      },
      addressproof: {
        type: String,
        default: 1, //1-Completed
      },
      idwithselfie: {
        type: String,
        default: 1, //1-Completed
      },
      status: {
        type: Number,
        default: 0, //1-submitted 2-Approved 3-rejected
      }
    }
  ],
  rejectReason: {
    type: String,
    default: ''
  },
  kycStatus: {
    type: Number,
    default: 0
  },
  kycStatus_submit: {
    type: Number,
    default: 0
  },
  Phototypeno: {
    type: String,
    default: "",
  },
  Photofile: {
    type: String,
  },
  IDstatus: {
    type: String,
    default: "Not verified",
  }, //0-Unverified, 1-Verified, 2->pending, 3->Rejected
  Addresstatus: {
    type: String,
    default: "Not verified",
  }, //0-Unverified, 1-Verified, 2->pending, 3->Rejected
  Photostatus: {
    type: String,
    default: "Not verified",
  }, //0-Unverified, 1-Verified, 2->pending, 3->Rejected[]
  verifiedstatus: {
    type: String,
    default: "Not verified", //0-Unverified, 1-Verified, 2 -pending
  },
  kycdate: {
    type: Date,
  },
  referaluserid: {
    type: Schema.Types.ObjectId,
    ref: "users",
  },
  referaluseremail: {
    type: String,
  },
  referencecode: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  deleted: {
    type: Number,
    default: 1, // 1 Active 0 Deleted
  },
  referals: [
    {
      referaluserid: {
        type: Schema.Types.ObjectId,
        // ref:'users',
      },
      referalid: {
        type: String,
        // ref:'users',
      },
      logindate: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  loginhistory: [
    {
      ip: {
        type: String,
        default: "",
      },
      city: {
        type: String,
        default: "",
      },
      regionName: {
        type: String,
        default: "",
      },
      country: {
        type: String,
        default: "",
      },
      loc: {
        type: String,
        default: "",
      },
      org: {
        type: String,
        default: "",
      },
      postal: {
        type: String,
        default: "",
      },
      timezone: {
        type: String,
        default: "",
      },
      status: {
        type: String,
        default: "Success", // success / failure
      },
      logindate: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

UserSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

UserSchema.set("toJSON", {
  virtuals: true,
});

UserSchema.methods.generateJWT = function (payload) {
  var token = jwt.sign(payload, config.secretOrKey);
  return `Bearer ${token}`;
};

module.exports = mongoose.model("usertemp", UserSchema, "usertemp");
