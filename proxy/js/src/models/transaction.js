const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        address: {
            type: String,
            required: [true, "Address is required"],
            trim: true
        },
        amount: {
            type: String,
            required: [true, "Amount is required"]
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true, // Adds createdAt and updatedAt timestamps
        versionKey: false // Removes __v field
    }
);

// Create indexes for common queries
transactionSchema.index({ address: 1 });
transactionSchema.index({ timestamp: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
