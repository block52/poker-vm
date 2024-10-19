import { Schema, model } from "mongoose";

const secretSchema = new Schema({
  account: {
    required: true,
    type: String,
  },
  data: {
    required: true,
    type: String,
  },
  hash: {
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

export default model("Secret", secretSchema);
