import { model, Schema } from "mongoose";
import { IAccountDocument } from "../models/interfaces";

const accountSchema = new Schema<IAccountDocument>(
    {
        address: {
            required: true,
            type: String,
        },
        balance: {
            required: true,
            type: Number, // BigInt
        },
        nonce: {
            required: true,
            type: Number,
        },
    },
    {
        timestamps: true,
    }
);

export default model("Accounts", accountSchema);