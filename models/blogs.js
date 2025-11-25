const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let blog = new Schema({
  blog_category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "blog_category",
  },
  meta_title: {
    type: String,
  },
  meta_description: {
    type: String,
  },
  meta_keywords: {
    type: String,
  },
  author: {
    type: String,
  },
  authorDetails: {
    type: String,
  },
  authorImage: {
    type: String,
  },
  title: {
    type: String,
  },
  content: {
    type: String,
  },
  image: {
    type: String,
  },
  slug: {
    type: String,
  },

  trendingPost: {
    type: String,
    default: "0",
  },

  alttag: {
    type: String,
  },

  author: {
    type: String,
  },
  metatitle: {
    type: String,
  },

  metadescription: {
    type: String,
  },
  metakeywords: {
    type: String,
  },

  social_link1: {
    type: String,
  },
  social_link2: {
    type: String,
  },
  social_link3: {
    type: String,
  },
  social_link4: {
    type: String,
  },
  social_link5: {
    type: String,
  },

  promotion_image: {
    type: String,
  },

  alttag_pro: {
    type: String,
  },

  slug: {
    type: String,
  },
  status: {
    type: String,
    enum: ["New", "Update", "Deactive"],
    default: "New", //active, deactive
  },
  date: {
    type: Date,
    default: Date.now,
  },
  created_date: {
    type: Date,
    default: Date.now,
  },
  updated_date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("blog", blog, "blog");
