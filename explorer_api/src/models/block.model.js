const mongoose = require('mongoose');
const { BlockDTO, TransactionDTO } = require('@bitcoinbrisbane/block52');

// Transaction Schema (nested within Block)
const transactionSchema = new mongoose.Schema({
    to: { type: String, required: true },
    from: { type: String, required: true },
    value: { type: String, required: true },
    hash: { type: String, required: true },
    signature: { type: String, required: true },
    timestamp: { type: String, required: true },
    index: { type: String, required: false },
    nonce: { type: String, required: false },
    data: { type: String, required: false }
}, { _id: false });

// Block Schema - matching BlockDTO interface
const blockSchema = new mongoose.Schema({
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
    signature: {
        type: String,
        required: true
    },
    merkleRoot: {
        type: String,
        required: true
    },
    previousHash: {
        type: String,
        required: true
    },
    transactions: {
        type: [String], // Array of transaction hashes
        default: []
    }
}, {
    timestamps: true
});

// Type checking function
blockSchema.methods.validateAgainstDTO = function() {
    const blockData = this.toObject();
    // Check if the data structure matches BlockDTO
    const requiredFields = ['hash', 'index', 'timestamp', 'validator', 'version', 
                          'signature', 'merkleRoot', 'previousHash', 'transactions'];
    
    return requiredFields.every(field => field in blockData);
};

module.exports = mongoose.model('Block', blockSchema); 