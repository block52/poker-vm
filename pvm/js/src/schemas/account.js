import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    address: {
      required: true,
      type: String,
    },
    balance: {
      required: true,
      type: Number, // BigInt
    },
    nonce: {
      required: true,
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Account", accountSchema);
