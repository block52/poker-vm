import { Document, model, Schema } from "mongoose";
import { IGameStateDocument } from "../models/interfaces";

const gameStateSchema = new Schema<IGameStateDocument>({
    address: {
        type: String,
        required: true
    },
    state: {
        type: Document,
        required: true
    }
}, {
    timestamps: true
});

export default model("GameState", gameStateSchema);