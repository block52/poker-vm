import { Schema, model } from "mongoose";

const gameStateSchema = new Schema({
  index : {
    required: true,
    type: Number,
  },
  contract: {
    required: true,
    type: String,
  },
  instance: {
    required: true,
    type: String,
  },
  state: {
    required: true,
    type: Object,
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

export default model("GameState", gameStateSchema);