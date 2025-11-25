const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let blog_category = new Schema({
	category_name:{
		type:String
	},
	slug:{
		type:String
	},
	status:{
		type:String,default:1
	},
	created_date:{
		type:Date,default: Date.now
	},
});

module.exports = mongoose.model('blog_category',blog_category,'blog_category');