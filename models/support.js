const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let replyschema = new Schema({ 
	message_query:{
		type:String
	},
	replytype:{
		type:String    // admin or user
	},
	replyby:{
		type: mongoose.Schema.Types.ObjectId
	},
	query_image:{
		type: String
	},
	replydate:{
		type:Date,default: Date.now
	}
});
let support = new Schema({
	email_add:{
		type:String,
		required:true,
	},
	subject:{
		type:String,
		required:true,
	},
	description:{
		type:String,
		required:true,
	},
	replystatus:{
		type:String,
		 default :"noreply"	
	},
	closedstatus:{
		type:String,
		default :"onprocess"			
	},
	created_date:{
		type:Date,
		default: Date.now
	},
	reply:[replyschema],
	attachment : {
        type: String,
    },
});
module.exports = mongoose.model('support',support,'support');
