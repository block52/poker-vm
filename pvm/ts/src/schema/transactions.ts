import { Schema, model } from "mongoose";
import { ITransactionDocument } from "../models/interfaces";

const transactionSchema = new Schema<ITransactionDocument>({
  nonce: {
    required: true,
    type: String, // Using String to store BigInt
  },
  index: {
    required: false,
    type: String, // Using String to store BigInt
  },
  to: {
    required: true,
    type: String,
  },
  from: {
    required: false,
    type: String,
  },
  value: {
    required: true,
    type: String, // Using String to store BigInt
  },
  data: {
    required: false,
    type: String,
  },
  timestamp: {
    required: true,
    type: String, // Using String to store BigInt
  },
  hash: {
    required: true,
    type: String,
  },
  signature: {
    required: true,
    type: String,
  },
  block_hash: {
    required: false,
    type: String,
  },
});

export default model("Transactions", transactionSchema);

