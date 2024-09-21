const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema({
  data: {
    required: true,
    type: Object,
  },
  hash: {
    required: true,
    type: String,
  },
});

module.exports = mongoose.model("Contract", contractSchema);
