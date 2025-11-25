// import package
import mongoose from "mongoose";
import config from "../config";

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const SiteSettingSchema = new Schema({
    userDashboard: [
        {
            _id: 0,
            currencyId: {
                type: ObjectId,
            },
            colorCode: {
                type: String,
                default: "",
            },
        },
    ],
    marketTrend: {
        type: [ObjectId],
        default: [],
    },
    companyName: {
        type: String,
        default: "",
    },
    siteName: {
        type: String,
        default: "",
    },
    address: {
        type: String,
        default: "",
    },
    contactNo: {
        type: String,
        default: "",
    },
    supportMail: {
        type: String,
        default: "",
    },
    facebookLink: {
        type: String,
        default: "",
    },
    facebookIcon: {
        type: String,
        default: "",
    },
    telegramlink: {
        type: String,
        default: "",
    },
    redditlink: {
        type: String,
        default: "",
    },
    youtubelink: {
        type: String,
        default: "",
    },
    twitterIcon: {
        type: String,
        default: "",
    },
    twitterUrl: {
        type: String,
        default: "",
    },
    linkedinIcon: {
        type: String,
        default: "",
    },
    linkedinLink: {
        type: String,
        default: "",
    },
    sitelogo: {
        type: String,
        default: "",
    },
    emailLogo: {
        type: String,
        default: "",
    },
});

SiteSettingSchema.virtual("emailLogoUrl").get(function () {
    return `${config.SERVER_URL}${config.IMAGE.SETTINGS_URL_PATH}${this.emailLogo}`;
});

SiteSettingSchema.set("toJSON", {
    virtuals: true,
});

const SiteSetting = mongoose.model(
    "sitesetting",
    SiteSettingSchema,
    "sitesetting"
);

export default SiteSetting;