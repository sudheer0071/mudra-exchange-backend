// import package
import mongoose from "mongoose";

const Schema = mongoose.Schema;
let cms = new Schema(
  {
    identifier: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: ""
    },
    image: [],
    metatitle: {
      type: String,
    },
    stage:{
      type: Number,
      default: 8
    },
    page: {
      type: String,
      default: "Home"
    },
    metadescription: {
      type: String,
    },

    metakeywords: {
      type: String,
    },

    order: {
      type: Number,
    },
    sliderType: {
      type: String,
      enum: ["web", "app", "cms"],
      default: "cms", //active, deactive
    },
    light_image: {
      type: String,
      default: "", //active, deactive
    },
    dark_image: {
      type: String,
      default: "", //active, deactive
    },
    status: {
      type: String,
      enum: ["active", "deactive"],
      default: "active", //active, deactive
    },
  },
  {
    timestamps: true,
  }
);

const Cms = mongoose.model("cms", cms, "cms");

export default Cms;
