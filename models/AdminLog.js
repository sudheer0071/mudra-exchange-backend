// import package
import mongoose from 'mongoose';



// import lib
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const AdminLogSchema = new Schema({
    userId: {
        type: ObjectId,
        required: true,
    },
    table: {
        type: String,
        default: "",
    },
    after: {

    },
    before: {},
    date: {
        type: Date,
        default: Date.now
    },
}, {
    timestamps: true
})

const AdminLog = mongoose.model("AdminLog", AdminLogSchema, "AdminLog");

export default AdminLog;