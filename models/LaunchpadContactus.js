const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Launchpad_contactus = new Schema({
	name:{
		type:String,
		required:true,
	},
	project:{
		type:String,
		required:true,
	},
	email:{
		type:String,
	    required:true,
	},
	created_date:{
		type:Date,
		default: Date.now
	},
});
module.exports = mongoose.model('Launchpad_contactus',Launchpad_contactus,'Launchpad_contactus');
