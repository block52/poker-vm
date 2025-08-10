import { model, Schema } from "mongoose";
import { IAccountDocument } from "../models/interfaces";

const accountSchema = new Schema<IAccountDocument>(
    {
        address: {
            required: true,
            type: String,
            unique: true, // Ensure address is unique
            index: true, // Indexing for faster queries
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

accountSchema.index({ address: 1, nonce: 1 }, { unique: true }); // Unique constraint on address + nonce combination

export default model("Accounts", accountSchema);