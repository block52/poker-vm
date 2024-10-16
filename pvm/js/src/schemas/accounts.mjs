import { Schema, model } from "mongoose";

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

export default model("Accounts", accountSchema);
