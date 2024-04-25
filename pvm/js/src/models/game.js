const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  owner: {
    required: true,
    type: String,
  },
  contract_hash: {
    required: true,
    type: String,
  },
  type: {
    required: true,
    type: String,
  },
  hash: {
    required: true,
    type: String,
  },
});

module.exports = mongoose.model("Game", gameSchema);
