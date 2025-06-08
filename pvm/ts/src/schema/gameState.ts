import { model, Schema } from "mongoose";
import { IGameStateDocument } from "../models/interfaces";

const gameStateSchema = new Schema<IGameStateDocument>(
    {
        address: {
            type: String,
            required: true
        },
        gameOptions: {
            type: Object,
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
