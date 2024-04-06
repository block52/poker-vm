const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  address: {
    required: true,
    type: String,
  },
  balance: {
    required: true,
    type: Number,
  },
});

module.exports = mongoose.model("Account", accountSchema);
