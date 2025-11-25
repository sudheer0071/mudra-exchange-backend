const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let sitemapSchema = new Schema({
	url:{
		type: String, default: ''
    }
    // status:{
	// 	type: String, default: 1, // 0 - deactive, 1-active
	// }
});
const SiteMap = mongoose.model("sitemap", sitemapSchema, 'sitemap');

export default SiteMap;
