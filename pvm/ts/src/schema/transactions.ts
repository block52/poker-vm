import { Schema, model } from "mongoose";
import { ITransactionDocument } from "../models/interfaces";

const transactionSchema = new Schema<ITransactionDocument>({
    nonce: {
        required: false,
        type: String // Using String to store BigInt
    },
    index: {
        required: false,
        type: String // Using String to store BigInt
    },
    to: {
        required: true,
        type: String,
        index: true // Indexing 'to' field for faster queries
    },
    from: {
        required: false,
        type: String,
        index: true // Indexing 'from' field for faster queries
    },
    value: {
        required: true,
        type: String // Using String to store BigInt
    },
    data: {
        required: false,
        type: String
    },
    timestamp: {
        required: true,
        type: String // Using String to store BigInt
    },
    hash: {
        required: true,
        type: String,
        index: true, // Indexing 'hash' field for faster queries
        unique: true // Ensuring 'hash' is unique
    },
    signature: {
        required: true,
        type: String
    },
    block_hash: {
        required: true,
        type: String,
        index: true // Indexing 'block_hash' field for faster queries
    }
});

// transactionSchema.index({ from: 1, nonce: 1 }, { unique: true }); // Unique constraint on from + nonce combination

export default model("Transactions", transactionSchema);
