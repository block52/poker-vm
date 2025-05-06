const mongoose = require("mongoose");

const depositSessionSchema = new mongoose.Schema({
    userAddress: {
        type: String,
        required: true,
        index: true
    },
    depositAddress: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ["PENDING", "PROCESSING", "COMPLETED", "EXPIRED"],
        default: "PENDING"
    },
    amount: {
        type: Number,
        default: null
    },
    txHash: {
        type: String,
        default: null
    },
    txStatus: {
        type: String,
        enum: ["DETECTED", "PROCESSING", "CONFIRMING", "CONFIRMED", "COMPLETED", null],
        default: null
    }
});

module.exports = mongoose.model("DepositSession", depositSessionSchema);
