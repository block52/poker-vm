const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema({
  address: {
    required: true,
    type: String,
  },
  balance: {
    required: true,
    type: Number,
  },
});

module.exports = mongoose.model("Block", blockSchema);
