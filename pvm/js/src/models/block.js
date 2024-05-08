const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema({
  index: {
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
    required: false,
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
  txs: {
    required: false,
    type: Array,
  },
});

module.exports = mongoose.model("Block", blockSchema);
