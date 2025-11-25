const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let category = new Schema({
	categoryName:{
		type: String, default: ''
    },
    status:{
		type: String, default: 1, // 0 - deactive, 1-active
	}
});

module.exports = mongoose.model('category',category,'category');