const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let contactus = new Schema({
	name: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
	firstname: {
		type: String,
	},
	lastname: {
		type: String,
	},
	message: {
		type: String,
		required: true,
	},
	reply: {
		type: String,
		default: "",
	},
	status: {
		type: Boolean,
		default: false,
	},
},
{
	timestamps: true
});
module.exports = mongoose.model("contactus", contactus, "contactus");