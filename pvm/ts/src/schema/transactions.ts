import { Schema, model } from "mongoose";
import { ITransactionDocument } from "../models/interfaces";

const transactionSchema = new Schema<ITransactionDocument>({
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
  signature: {
    required: true,
    type: String,
  },
  timestamp: {
    required: true,
    type: String, // Using String to store BigInt
  },
  index: {
    required: false,
    type: String, // Using String to store BigInt
  },
  hash: {
    required: true,
    type: String,
  },
});

export default model("Transactions", transactionSchema);

