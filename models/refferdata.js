const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let Referinfo = new Schema({
  refer_parent: {
    type: Schema.Types.ObjectId,
    ref: "users",
  },
  refer_child: {
    type: Schema.Types.ObjectId,
    ref: "users",
  },
  ipaddress: {
    type: String,
  },
  referencecode: {
    type: String,
  },
});

module.exports = mongoose.model("Referdata", Referinfo, "Referdata");
