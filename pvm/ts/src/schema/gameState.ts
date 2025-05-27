import { model, Schema } from "mongoose";
import { IGameStateDocument } from "../models/interfaces";

const gameStateSchema = new Schema<IGameStateDocument>(
    {
        address: {
            type: String,
            required: true
        },
        schemaAddress: {
            type: String,
            required: true
        },
        state: {
            type: Object,
            required: true
        }
    },
    {
        timestamps: true
    }
);

export default model("GameState", gameStateSchema);
