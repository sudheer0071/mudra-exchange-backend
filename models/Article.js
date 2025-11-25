const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let Article = new Schema({
  Articlename: {
    type: String,
  },
  maincategoryId: {
    type: Schema.Types.ObjectId,
    ref: "category",
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  article_image: {
    type: String,
  },
  createdDate: {
    type: Date,
    default: new Date(),
  },
  status: {
    type: String,
    default: 1, // 0 - deactive, 1-active
  },
});

module.exports = mongoose.model("Article", Article, "Article");
