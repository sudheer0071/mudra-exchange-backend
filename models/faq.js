// import package
import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const faqSchema = new Schema({
	categoryId: {
		type: ObjectId,
		required: true,
		ref: 'faqcategory'
	},
	question: {
		type: String,
		required: true,
	},
	answer: {
		type: String,
		required: true,
	},
	status: {
		type: String,
		enum: ['active', 'deactive'],
		default: 'active'
	},
}, {
	timestamps: true
});

const Faq = mongoose.model('faq', faqSchema, 'faq');

export default Faq;
