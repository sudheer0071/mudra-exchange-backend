const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let sparewallet = new Schema({
  currency:{
		type: String
	},
	address:{
		type: String
	},
    private:{
        type: String, default: '' 
    }
});

module.exports = mongoose.model('sparewallet',sparewallet,'sparewallet');
