import multer from "multer";
import mongoose from "mongoose";

//import config
import config from "../config";

const Validator = require("validator");
const isEmpty = require("is-empty");
// module.exports = function validateCmsInput(data) {
//     let errors = {};
//     data.identifier = !isEmpty(data.identifier) ? data.identifier : "";
//     data.subject = !isEmpty(data.subject) ? data.subject : "";
//     data.content = !isEmpty(data.content) ? data.content : "";
//     if (Validator.isEmpty(data.identifier)) {
//         errors.identifier = "Identifier field is required";
//     }
//     if (Validator.isEmpty(data.subject)) {
//         errors.subject = "Subject field is required";
//     }
//     if (Validator.isEmpty(data.content)) {
//         errors.content = "Content field is required";
//     }
//     return {
//         errors,
//         isValid: isEmpty(errors)
//     };
// };

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname == "whitePaper") {
            cb(null, config.IMAGE.LAUNCHPAD_WHITEPAPER_PATH);
        } else {
            cb(null, config.IMAGE.CURRENCY_PATH);
        }
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

var upload = multer({ storage: storage });
export const LaunchpadUpload = upload.fields([
    { name: "light_image", maxCount: 1 },
    { name: "dark_image", maxCount: 1 },
   
]);



export const sliderValidate = (req, res, next) => {
    let errors = {},
        reqBody = req.body,
        reqFile = req.files;
    console.log(
        reqBody,
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        reqFile,
        "gggggggggggggggggggggg"
    );
    let file = req.files;

    let allowedExtension = ['jpeg', 'jpg', 'png'];
    let slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    // if (isEmpty(reqBody.meta_title)) {
    //     errors.meta_titleErr = "Meta Title field is required";
    // }
    // if (isEmpty(reqBody.meta_description)) {
    //     errors.meta_descriptionErr = "Meta Description field is required";
    // }
    // if (isEmpty(reqBody.meta_keywords)) {
    //     errors.meta_keywordsErr = "Meta Keywords field is required";
    // }
    if (isEmpty(reqBody.identifier)) {
        errors.identifier = "Identifier field is required";
    }
    if (isEmpty(reqBody.title) || reqBody.title == "undefined") {
        errors.title = "Title field is required";
    }
    // if (
    //     isEmpty(reqBody.subject) ||
    //     reqBody.subject == "undefined"
    // ) {
    //     errors.subject = "subject field is required";
    // }

    // if (isEmpty(reqBody.page) || reqBody.page == "undefined") {
    //     errors.page = "page field is required";
    // }
    // if (isEmpty(reqBody.sliderType) || reqBody.sliderType == "undefined") {
    //     errors.sliderType = "slider type field is required";
    // } else if (reqBody.sliderType == 'web') {
    //     if (isEmpty(reqBody.content) || reqBody.content == "undefined") {
    //         errors.content = "Content field is required";
    //     }
    // } else if (reqBody.sliderType == 'app') {
        if(isEmpty(reqBody._id)){
            if (isEmpty(file.light_image && file.light_image[0])) {
                errors.light_image = "Image field is required";
            } else {
                let type = file.light_image[0].mimetype.split('/')[1]
                if (!allowedExtension.includes(type)) {
                    errors.light_image = "Please Choose with the known image types jpg, jpeg or png.";
                }
            }
            if (isEmpty(file.dark_image && file.dark_image[0])) {
                errors.dark_image = "Image field is required";
            } else {
                let type = file.dark_image[0].mimetype.split('/')[1]
                if (!allowedExtension.includes(type)) {
                    errors.dark_image = "Please Choose with the known image types jpg, jpeg or png.";
                }
            }
        }
    // }
    if (!isEmpty(errors)) {
        return res.status(400).json({ status: false, errors: errors });
    }

    return next();
};
