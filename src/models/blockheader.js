const mongoose = require("mongoose");

const blockHeaderSchema = new mongoose.Schema({
  height: {
    required: true,
    type: Number,
  },
  version: {
    required: true,
    type: Number,
  },
  hash: {
    required: true,
    type: String,
  },
  merkle_root: {
    required: true,
    type: String,
  },
  previous_block_hash: {
    required: true,
    type: String,
  },
  timestamp: {
    required: true,
    type: Number,
  },
  validator: {
    required: true,
    type: String,
  },
  signature: {
    required: true,
    type: String,
  },
});

module.exports = mongoose.model("BlockHeader", blockHeaderSchema);
