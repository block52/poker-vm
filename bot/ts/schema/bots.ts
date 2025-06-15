import { model, Schema } from "mongoose";

const botSchema = new Schema(
    {
        address: {
            required: true,
            type: String,
        },
        tableAddress: {
            required: true,
            type: String,
        },
        privateKey: {
            required: true,
            type: String,
        },
        type: {
            type: String,
        },
        enabled: {
            type: Boolean,
            default: true,
        }
    }
);

export default model("Bots", botSchema);