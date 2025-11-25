import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const loginHistorySchema = new Schema({

    userId: {
        type: ObjectId,
        ref: 'admins',
    },
    countryCode: {
        type: String,
        default: ''
    },
    countryName: {
        type: String,
        default: ''
    },
    regionName: {
        type: String,
        default: ''
    },
    ipaddress: {
        type: String,
        default: ''
    },
    broswername: {
        type: String,
        default: ''
    },
    ismobile: {
        type: String,
        default: ''
    },
    os: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        default: 'Success' // success / failure
    },
    reason: {
        type: String,
        default: '' // success / failure
    },
    createdDate: {
        type: Date,
        default: Date.now // success / failure
    }

})

const loginHistoryModel = mongoose.model("loginHistoryModel", loginHistorySchema, "loginHistoryModel");
module.exports = loginHistoryModel;

