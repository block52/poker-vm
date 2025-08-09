import { model, Schema } from "mongoose";
import { IAccountDocument } from "../models/interfaces";

const accountSchema = new Schema<IAccountDocument>(
    {
        address: {
            required: true,
            type: String,
            index: true, // Indexing 'address' field for faster queries
            unique: true, // Ensuring 'address' is unique
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