import { Schema, model } from "mongoose";

const gameSchema = new Schema({
  owner: {
    required: true,
    type: String,
  },
  address: {
    required: true,
    type: String,
  },
  index : {
    required: true,
    type: Number,
  },
  type: {
    required: true,
    type: String,
  },
  hash: {
    required: true,
    type: String,
  },
  previous_hash: {
    required: true,
    type: String,
  },
});

export default model("Game", gameSchema);
