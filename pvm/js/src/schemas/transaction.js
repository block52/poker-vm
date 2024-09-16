const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    account: {
      required: true,
      type: String,
    },
    nonce: {
      required: true,
      type: Number,
    },
    amount: {
      required: true,
      type: Number,
    },
    data: {
      required: false,
      type: String,
    },
    hash: {
      required: true,
      type: String,
    },
    block_hash: {
      required: true,
      type: String
    },
    signature: {
      required: true,
      type: String,
    },
    timestamp: {
      required: true,
      type: Number,
    },
  },
  {
    timestamp: true,
  }
);

module.exports = mongoose.model("Transactions", transactionSchema);
