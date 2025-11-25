const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let settings = new Schema({

	email:{
		type:String, 
		required:true,
		index: true 
	},
	contact_person:{
		type:String, 
		required:true,
		index: true
    },
	sitename:{
		type:String,
		required:true,
		index: true
	},
	site_description:{
		type:String,
		// required:true,
	},
	favorite_image:{
		type:String,
	}, 
	sitelogo:{
		type:String
	},
	phone_number:{
		type:String, 
		required:true,
	},
	mobile_number:{
		type:String, 
		required:true,
	},
	company_info_link:{
		type:String, 
		required:true,
	},
	license_info_link:{
		type:String, 
		required:true,
	},
	address:{
		type:String, 
		required:true,
	},
	google_analytics:{
		type:String
	},
 	tax_amount: {
		type:Number, // in percentage 
	}, 
	social_link1:{
		type:String
	}, 
	social_link2:{
		type:String
	}, 
	social_link3:{
		type:String
	}, 
	social_link4:{
		type:String
	}, 
	social_link5:{
		type:String
	}, 
	reg_code:{
		type:String
	}, 
	copyright_text:{
		type:String, 
		required:true,
	}, 
	working_day:{
		type:String, 
		required:true,
	},
	working_hours:{
		type:String, 
		required:true,
	},
	maintanancestate: {
        type: Boolean,
        default: false    //false- disable, true- enable maintanancestate
      }, 
    forcedliq:{
    	type:String,
    	default:"Enable"
    }

});

module.exports = mongoose.model('settings',settings,'settings');