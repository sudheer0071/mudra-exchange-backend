const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ChartSchema = new Schema({
    type: {
        type: String,
        default: ""  // 1 , 5 ,30,60,d,1w,1m
    },
    pairname: {
        type: String,
        default: ""
    },
    data: [],
    createddate: {
        type: Date,
        default: Date.now
    }
});
const Chart = mongoose.model("chart", ChartSchema);
module.exports = Chart;
