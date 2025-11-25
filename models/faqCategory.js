// import package
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const faqCategorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['active', 'deactive'],
        default: 'active'
    },
}, {
    timestamps: true
});
const FaqCategory = mongoose.model('faqcategory', faqCategorySchema, 'faqcategory');

export default FaqCategory;