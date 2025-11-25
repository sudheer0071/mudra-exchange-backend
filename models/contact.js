const mongoose = require('mongoose');
const Schema = mongoose.Schema; 
let contact = new Schema({	
	email:{ 
		type:String, 
		index: true, 
	},
	name:{ 
		type:String, 
		index: true, 
	},
	message:{  
		type:String, 
	},
	  
	status:{
		type:String,default:1
	},
	created_date:{
		type:Date,default: Date.now
	},
});

module.exports = mongoose.model('contact',contact,'contact');