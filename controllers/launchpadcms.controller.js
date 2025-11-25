// import package

// import model

//import packages
import multer from 'multer'
import mongoose from 'mongoose'
const sharp = require('sharp')
// app.use(express.static(__dirname + "/public"));

//import config
import config from '../config'

//import controller
// import { createAssetAtAddCurrency } from './assets.controller'

//import lib
import isEmpty from '../lib/isEmpty'
import { LaunchpadCms } from "../models";

// Models

const ObjectId = mongoose.Types.ObjectId;


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname == "whitePaper") {
      cb(null, config.IMAGE.LAUNCHPAD_WHITEPAPER_PATH)
    } else {
      cb(null, config.IMAGE.CURRENCY_PATH)
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

var upload = multer({ storage: storage });
export const LaunchpadUpload = upload.fields([{ name: 'image', maxCount: 1 }])
/**
 * Get Cms List
 * URL : /adminapi/cms
 * METHOD : GET
 */
// export const getCmsList = (req, res) => {
//   Cms.find(
//     {},
//     {
//       _id: 1,
//       identifier: 1,
//       title: 1,
//       content: 1,
//       image: 1,
//       status: 1,
//       metakeywords: 1,
//       metatitle: 1,
//       metadescription: 1,
//     },
//     (err, data) => {
//       if (err) {
//         return res
//           .status(500)
//           .json({ success: false, message: "Something went wrong" });
//       }
//       return res
//         .status(200)
//         .json({ success: true, message: "Fetch successfully", result: data });
//     }
//   );
// };

/**
 * Update Cms List
 * URL : /adminapi/cms
 * METHOD : PUT
 * BODY : id, identifier, title, content
 */
// export const updateCms = async (req, res) => {
//   try {
//     let reqBody = req.body;

//     console.log("reqBodyreqBodyreqBody", reqBody);

//     let checkCmsData = await Cms.findOne({ _id: reqBody.id });
//     if (!checkCmsData) {
//       return res
//         .status(400)
//         .json({ status: false, message: "There is no cms" });
//     }

//     checkCmsData.identifier = reqBody.identifier;
//     checkCmsData.title = reqBody.title;
//     checkCmsData.content = reqBody.content;

//     checkCmsData.metatitle = reqBody.metatitle;

//     checkCmsData.metadescription = reqBody.metadescription;

//     checkCmsData.metakeywords = reqBody.metakeywords;

//     await checkCmsData.save();
//     return res
//       .status(200)
//       .json({ status: true, message: "Cms updated successfully" });
//   } catch (err) {
//     console.log("Error on cms", err);
//     return res
//       .status(500)
//       .json({ status: false, message: "Something went wrong" });
//   }
// };

export const updateLaunchpadCms = async (req, res) => {
  try {
    let reqBody = req.body;
    const file = req.files;


    let checkCmsData = await LaunchpadCms.findOne({ _id: reqBody.id });
    if (!checkCmsData) {
      return res
        .status(400)
        .json({ status: false, message: "There is no cms" });
    }

    if (!isEmpty(file) && !isEmpty(file.image) && !isEmpty(file.image[0])) {
      var metatag = sharp(file.image[0].filename)
        .resize(100, 100)
        // __dirname + '/' + request.params.filepath
        .toFile(__dirname + '/public/images/tinymce/ouput.png', function (err) {
          console.log('err', err)
          // output.jpg is a 200 pixels wide and 200 pixels high image
          // containing a scaled and cropped version of input.jpg
        });
    
      checkCmsData.identifier = reqBody.identifier;
      checkCmsData.title = reqBody.title;
      checkCmsData.content = reqBody.content;
      checkCmsData.image = file.image[0].filename;
      checkCmsData.metatitle = reqBody.metatitle;
      checkCmsData.metadescription = reqBody.metadescription;
      checkCmsData.metakeywords = reqBody.metakeywords;
      checkCmsData.metalink = reqBody.metalink;

      await checkCmsData.save();
      return res
        .status(200)
        .json({ status: true, message: "Launchpad Cms updated successfully" });
    } else {
      checkCmsData.identifier = reqBody.identifier;
      checkCmsData.title = reqBody.title;
      checkCmsData.content = reqBody.content;
      // checkCmsData.image = file.image[0].filename;
      checkCmsData.metatitle = reqBody.metatitle;

      checkCmsData.metadescription = reqBody.metadescription;
      checkCmsData.metalink = reqBody.metalink;
      checkCmsData.metakeywords = reqBody.metakeywords;

      await checkCmsData.save();
      return res
        .status(200)
        .json({ status: true, message: "Launchpad Cms updated successfully" });
    }

  } catch (err) {
    console.log("Error on cms", err);
    return res
      .status(500)
      .json({ status: false, message: "Something went wrong" });
  }
};


/**
 * Get CMS Page
 * URL : /api/cms/{{}}
 * METHOD : GET
 * PARAMS : identifier
 */
export const getLaunchpadCmsList = (req, res) => {

  // console.log('req.body',req.body)
  LaunchpadCms.find(
    {},
    {
      _id: 1,
      identifier: 1,
      title: 1,
      content: 1,
      image: 1,
      status: 1,
      metakeywords: 1,
      metatitle: 1,
      metadescription: 1,
      metalink: 1,
    },
    (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Something went wrong" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Fetch successfully", result: data });
    }
  );
};

/**
 * Update Launchpad
 * URL : /adminapi/getAppLaunchpadList
 * METHOD : GET
 */

export const getAppLaunchpadList = async (req, res) => {
  try {
    let darkList = [];
    let lightList = [];
    let d = await LaunchpadCms.find({ themeMode: "dark" });
    let launchpadData = await LaunchpadCms.find({ themeMode: { $in: ['dark', 'light'] } });
    if (launchpadData.length > 0) {
      launchpadData.map((data, i) => {
        if (data.themeMode == "dark") {
          darkList.push({
            image: data.image
          })
        } else if (data.themeMode == "light") {
          lightList.push({
            image: data.image
          })
        }
      })
    }
    let result = {
      darkList,
      lightList
    }

    return res.status(200).json({ status: true, data: result });

  } catch (err) {
    console.log(err, "----err");
    return res.status(500).json({ status: false, message: "Error On Occured" });
  }
};