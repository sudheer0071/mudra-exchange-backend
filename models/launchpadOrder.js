import mongoose  from 'mongoose';
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

let LaunchpadOrderSchema = new Schema({

	userId:{
		type:ObjectId,
		ref:'users',
	},
	launchpadId:{
		type:ObjectId,
		ref:'launchpad',
	},
	currencyId:{
		type:ObjectId,  
		ref:'currency',
	},
	discount:{
		type:Number,
	},
	price:{
		type:Number,
	},
	quantity:{
		type:Number,
	},
	total:{
		type:Number,
	},
	currencySymbol:{
        type:String,
		// required:true,
	},
	created_date:{
		type:Date,
		default: new Date()
	},
});

const Launchpad = mongoose.model("launchpadOrder", LaunchpadOrderSchema,'launchpadOrder');

export default Launchpad;
