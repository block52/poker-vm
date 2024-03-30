const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema({
  title: {
    required: true,
    type: String,
  },
  description: {
    required: true,
    type: String,
  },
  data: {
    required: true,
    type: Object,
  },
  version: {
    required: true,
    type: String,
  },
  hash: {
    required: true,
    type: String,
  },
});

module.exports = mongoose.model("Contract", contractSchema);
