const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let address = new Schema({
	name:{
		type: String, default: ''
	},
  currency:{
		type: String, default: ''
	},
  userId : {
    type : Schema.Types.ObjectId, ref: 'users'
  },
	address:{
		type: String, default: ''
	},
	tagid:{
		type: String, default: ''
	},
	status:{
		type: Number, default: 1, // 0 - deactive, 1-active
	},
});

module.exports = mongoose.model('address',address,'address');
