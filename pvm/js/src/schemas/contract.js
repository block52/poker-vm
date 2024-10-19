import { Schema, model } from "mongoose";

const contractSchema = new Schema({
  data: {
    required: true,
    type: Object,
  },
  hash: {
    required: true,
    type: String,
  },
});

export default model("Contract", contractSchema);
