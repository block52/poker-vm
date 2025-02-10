import { Block } from "../src/models/block";
import { ethers } from "ethers";
import { getBlockchainInstance } from "../src/state/blockchainManagement";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const createGenesisBlock = async (): Promise<Block> => {
    // 1. Connect to MongoDB first
    const dbUrl = process.env.DB_URL || "mongodb://localhost:27019/local_pvm";
    console.log("Connecting to database:", dbUrl);
    
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
    }

    // 2. Get and format validator key from environment
    let privateKey = process.env.VALIDATOR_KEY;
    
    if (!privateKey) {
        throw new Error("VALIDATOR_KEY not found in .env - Please set VALIDATOR_KEY in your environment");
    }

    // Add 0x prefix if it's missing
    if (!privateKey.startsWith('0x')) {
        privateKey = `0x${privateKey}`;
    }

    try {
        // Validate the private key format
        const validatorAddress = ethers.computeAddress(privateKey);
        console.log("Creating genesis block with validator:", validatorAddress);
    } catch (error) {
        console.error("Invalid private key format. Please ensure it's a 64-character hex string");
        throw error;
    }
    
    const block = Block.create(0, ethers.ZeroHash, [], privateKey);

    // 3. Save to blockchain
    const blockchain = getBlockchainInstance();
    await blockchain.addBlock(block);

    console.log("Genesis block saved to database");

    // 4. Close database connection
    await mongoose.connection.close();

    return block;
}

// Run the genesis block creation
const main = async () => {
    try {
        const block = await createGenesisBlock();
        console.log("Genesis block created:", {
            index: block.index,
            hash: block.hash,
            validator: block.validator,
            timestamp: block.timestamp,
            transactionCount: block.transactions.length
        });
    } catch (error) {
        console.error("Error creating genesis block:", error);
        process.exit(1);
    }
    process.exit(0);
}

main(); 