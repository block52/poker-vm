import { Schema, model } from "mongoose";

const transactionSchema = new Schema(
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

export default model("Transactions", transactionSchema);
