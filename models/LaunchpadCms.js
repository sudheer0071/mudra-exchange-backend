// import package
import mongoose from "mongoose";

const Schema = mongoose.Schema;
let LaunchpadCms = new Schema(
  {
    identifier: {
      type: String,
      required: true,
      unique: true,
    },
    themeMode: {
      type: String,
      default: ""
    },

    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,

    },
    // image: [],
    metatitle: {
      type: String,
    },

    metadescription: {
      type: String,
    },

    metakeywords: {
      type: String,
    },

    metalink: {
      type: String,
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

//  export default LaunchpadCms= mongoose.model("launchpadCms", LaunchpadCms, "launchpadCms");

module.exports = mongoose.model('LaunchpadCms', LaunchpadCms, 'LaunchpadCms');
