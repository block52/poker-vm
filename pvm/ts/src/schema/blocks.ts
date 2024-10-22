import { Schema, model } from "mongoose";
import { IBlockDocument } from "../models/interfaces";

const blocksSchema = new Schema<IBlockDocument>({
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
  transactions: {
    required: false,
    type: Array,
  },
  tx_count: {
    required: false,
    type: Number,
  },
});

export default model("Blocks", blocksSchema);
