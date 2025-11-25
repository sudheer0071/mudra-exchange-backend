// import package
import mongoose from 'mongoose';

// import lib

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

let replySchema = new Schema({
    _id: 0,
    senderId: {
        type: ObjectId,
    },
    receiverId: {
        type: ObjectId,
    },
    messageBy: {
        type: String
    },
    message: {
        type: String,
        default: ''
    },
    file: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const SupportTicketSchema = new Schema({
    userId: {
        type: ObjectId,
        required: true,
    },
    tickerId: {
        type: String,
        unique: true,
        required: true
    },
    adminId: {
        type: ObjectId,
        required: true,
    },
    categoryId: {
        type: ObjectId,
        required: true,
    },

    reply: [replySchema],
    status: {
        type: String,
        default: 'open'    //open, closed
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const SupportTicket = mongoose.model("supportticket", SupportTicketSchema, 'supportticket');

export default SupportTicket;