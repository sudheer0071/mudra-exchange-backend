// import package
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

let SupportCategorySchema = new Schema({
    categoryName: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'deactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

const SupportCategory = mongoose.model("supportcategory", SupportCategorySchema, 'supportcategory');

export default SupportCategory;