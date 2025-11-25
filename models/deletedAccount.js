// import package
import mongoose from "mongoose";

const Schema = mongoose.Schema;

let deletedAccount = new Schema({
  tokenamount: {
    type: String,
  },

  email: {
    type: String,
  }, 
  phoneCode: {
    type: String,
    default: "",
  },
  phoneNo: {
    type: String,
    default: "",
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    index: true,
  },


  createdDate: {
    type: Date,
    default: Date.now,
  },

});

const DeletedAccount = mongoose.model("deletedAccount", deletedAccount, "deletedAccount");

export default DeletedAccount;
