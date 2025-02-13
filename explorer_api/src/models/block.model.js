const mongoose = require("mongoose");

// Transaction Schema (nested within Block)
const transactionSchema = new mongoose.Schema(
    {
        nonce: { type: String, required: false },
        to: { type: String, required: true },
        from: { type: String, required: true },
        value: { type: String, required: true },
        hash: { type: String, required: true },
        signature: { type: String, required: true },
        timestamp: { type: String, required: true },
        data: { type: String, required: false }
    },
    { _id: false }
);

// Block Schema - matching the actual PVM response
const blockSchema = new mongoose.Schema(
    {
        hash: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        index: {
            type: Number,
            required: true,
            unique: true,
            index: true
        },
        previousHash: {
            type: String,
            required: true
        },
        merkleRoot: {
            type: String,
            required: true
        },
        signature: {
            type: String,
            required: true
        },
        timestamp: {
            type: Number,
            required: true
        },
        validator: {
            type: String,
            required: true
        },
        version: {
            type: String,
            required: true
        },
        transactions: {
            type: [transactionSchema],
            default: []
        },
        transactionCount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Type checking function
blockSchema.methods.validateAgainstDTO = function () {
    const blockData = this.toObject();
    const requiredFields = ["hash", "index", "previousHash", "merkleRoot", "signature", "timestamp", "validator", "version", "transactions"];

    return requiredFields.every(field => field in blockData);
};

module.exports = mongoose.model("Block", blockSchema);
