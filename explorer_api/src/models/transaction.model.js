const mongoose = require('mongoose');
const { TransactionDTO } = require('@bitcoinbrisbane/block52');

const transactionSchema = new mongoose.Schema({
    to: {
        type: String,
        required: true,
        index: true
    },
    from: {
        type: String,
        required: true,
        index: true
    },
    value: {
        type: String,
        required: true
    },
    hash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    signature: {
        type: String,
        required: true
    },
    timestamp: {
        type: String,
        required: true
    },
    nonce: {
        type: String,
        required: false
    },
    data: {
        type: String,
        required: false
    },
    blockHash: {
        type: String,
        required: true,
        index: true
    },
    blockIndex: {
        type: Number,
        required: true,
        index: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema); 