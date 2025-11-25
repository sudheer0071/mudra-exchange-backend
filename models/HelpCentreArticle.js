const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let HelpCentreArticle = new Schema({
  Articlename: {
    type: String
  },
  maincategoryId: {
    type: Schema.Types.ObjectId,
    ref: 'HelpCentrecategory',
    index: true
  },
  subcategoryId: {
    type: Schema.Types.ObjectId,
    ref: 'subcategory',
    index: true
  },
  content:{
    type:String,
    required:true
  },
  article_image:{
		type: String
	},

  status: {
    type: String,
    default: 1, // 0 - deactive, 1-active
  }
});

module.exports = mongoose.model('HelpCentreArticle', HelpCentreArticle, 'HelpCentreArticle');
