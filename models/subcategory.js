const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let subcategory = new Schema({
	subcategoryName:{
		type: String
    },
    maincategoryId:{
		type: Schema.Types.ObjectId, ref: 'HelpCentrecategory', index:true
    },
    status:{
		type: String, default: 1, // 0 - deactive, 1-active
	}
});

module.exports = mongoose.model('subcategory',subcategory,'subcategory');
