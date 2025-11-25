import mongoose from 'mongoose';
const Schema = mongoose.Schema;

let LaunchpadSchema = new Schema({

	tokenName: {
		type: String,
		// required:true,
	},
	symbol: {
		type: String,
		// required:true,
	},
	tokenType: {
		type: String,  // 1 - ERC20, 2 - BEP20, 3 - TRC20
		default: 'erc20',
	},
	availableCurrency: {
		type: String,
	},
	price: {
		type: Number,
		// required:true,
	},
	minAmt: {
		type: Number,

	},
	discount: {
		type: Number,
		// required:true,
	},
	availableSale: {
		type: Number,
		default: 0
	},
	decimals: {
		type: Number,
		default: 0
	},
	maxSupply: {
		type: Number,
		// required:true,
	},
	industry: {
		type: String,
		// required:true,
	},
	website: {
		type: String,
		// required:true,
	},
	content: {
		type: String,

	},
	image: {
		type: String,

	},
	whitePaper: {
		type: String,

	},
	telegramLink: {
		type: String,

	},
	twitterLink: {
		type: String,

	},
	linkedinLink: {
		type: String,

	},
	redditLink: {
		type: String,

	},
	youtubeLink: {
		type: String,

	},
	facebookLink: {
		type: String,

	},
	instagramLink: {
		type: String,

	},
	status: { // active, inactive
		type: String,
		default: "active"

	},
	tokenStatus: { // "", active, completed
		type: String,
		default: ""
	},
	startDate: {
		type: Date,
		default: Date.now

	},
	endDate: {
		type: Date,
		default: Date.now

	},
	created_date: {
		type: Date,
		default: Date.now
	},

	email: {
		type: String,
		// required:true,
	},
	Name: {
		type: String,
		// required:true,
	}, country: {
		type: String,
		// required:true,
	}, state: {
		type: String,
		// required:true,
	}, city: {
		type: String,
		// required:true,
	},
	postalCode: {
		type: String,
		// required:true,
	},
	contractAddress: {
		type: String,
		// required:true,
	},
});

const Launchpad = mongoose.model("launchpad", LaunchpadSchema, 'launchpad');

export default Launchpad;
