const mongoose = require("mongoose");

const secretSchema = new mongoose.Schema({
  account: {
    required: true,
    type: String,
  },
  data: {
    required: true,
    type: String,
  },
  hash: {
    required: true,
    type: String,
  },
  signature: {
    required: true,
    type: String,
  },
  timestamp: {
    required: true,
    type: Number,
  },
});

module.exports = mongoose.model("Secret", secretSchema);
