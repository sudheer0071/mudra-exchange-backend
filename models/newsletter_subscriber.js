const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let newsletter_subscriber = new Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },

  created_date: {
    type: Date,
    default: new Date(),
  },
});

module.exports = mongoose.model(
  "newsletter_subscriber",
  newsletter_subscriber,
  "newsletter_subscriber"
);
