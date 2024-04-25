const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
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

module.exports = mongoose.model("Transaction", transactionSchema);
