const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const DepositSession = require("../models/depositSession");
console.log("DepositSession model:", DepositSession);

// Update contract addresses to mainnet
const DEPOSIT_ADDRESS = "0xADB8401D85E203F101aC715D5Aa7745a0ABcd42C";  // Your mainnet deposit contract

// Using Sepolia RPC URL from hardhat.config.ts
const RPC_URL = "https://mainnet.infura.io/v3/4a91824fbc7d402886bf0d302677153f";
const PRIVATE_KEY = process.env.DEPOSIT_PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Add this function to handle the token transfer
async function handleTokenTransfer(amount, userAddress) {
    console.log("=== Starting handleTokenTransfer ===");
    console.log("Amount:", amount.toString());
    console.log("User Address:", userAddress);

    // Check for valid inputs to prevent empty data errors
    if (!userAddress || !amount) {
        console.error("Invalid inputs: address or amount is missing");
        return { success: false };
    }

    try {
        // Create interface with the full ABI
        const depositInterface = new ethers.Interface([
            {
                "inputs": [
                    {"internalType": "address", "name": "user", "type": "address"},
                    {"internalType": "uint256", "name": "amount", "type": "uint256"}
                ],
                "name": "forwardDepositUnderlying", // Changed to forwardDepositUnderlying based on contract
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]);
        
        const wallet = new ethers.Wallet(process.env.DEPOSIT_PRIVATE_KEY, provider);
        
        // Create contract instance with interface
        const depositContract = new ethers.Contract(
            DEPOSIT_ADDRESS,
            depositInterface,
            wallet
        );

        console.log("Attempting forwardDepositUnderlying with:");
        console.log("- User:", userAddress);
        console.log("- Amount:", amount);

        // Encode the function data properly to prevent empty data
        const data = depositInterface.encodeFunctionData("forwardDepositUnderlying", [userAddress, amount]);
        console.log("Encoded function data:", data);

        // Use manual transaction to ensure data is included
        const tx = await wallet.sendTransaction({
            to: DEPOSIT_ADDRESS,
            data: data,
            gasLimit: 300000,
            maxFeePerGas: ethers.parseUnits("3", "gwei"),
            maxPriorityFeePerGas: ethers.parseUnits("1.5", "gwei")
        });
        
        console.log("Transaction hash:", tx.hash);
        
        // Return transaction hash for tracking
        return { 
            success: true, 
            hash: tx.hash,
            status: "CONFIRMING"
        };
    } catch (error) {
        console.error("=== Error in handleTokenTransfer ===");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        
        // Check if error is due to transaction already being processed
        if (error.message && error.message.includes("already known")) {
            console.log("Transaction already submitted, may be pending confirmation");
            return { 
                success: true, 
                status: "CONFIRMING",
                message: "Transaction already submitted"
            }; 
        }
        
        if (error.transaction) {
            console.error("Transaction details:", {
                from: error.transaction.from,
                to: error.transaction.to,
                data: error.transaction.data
            });
        }
        return { success: false };
    }
}

// Add a function to check transaction status
async function checkTransactionStatus(txHash) {
    try {
        if (!txHash) return null;
        
        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt) {
            return "CONFIRMING";
        }
        
        return receipt.status === 1 ? "CONFIRMED" : "FAILED";
    } catch (error) {
        console.error("Error checking transaction status:", error);
        return null;
    }
}

// Create deposit session
router.post("/", async (req, res) => {
    console.log("Received deposit session request:", req.body);
    const { userAddress, depositAddress } = req.body;

    try {
        // Check for existing active session
        const existingSession = await DepositSession.findOne({
            userAddress,
            status: "PENDING",
            expiresAt: { $gt: new Date() }
        });

        if (existingSession) {
            // Return existing session with remaining time
            return res.status(200).json({
                ...existingSession.toObject(),
                remainingTime: Math.max(0, existingSession.expiresAt - new Date())
            });
        }

        // Create new session with 5 minute expiry
        const session = new DepositSession({
            userAddress,
            depositAddress,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
            status: "PENDING"
        });

        await session.save();
        console.log("Created new session:", session);
        res.status(201).json(session);
    } catch (error) {
        console.error("Error creating deposit session:", error);
        res.status(500).json({ error: "Failed to create deposit session" });
    }
});

// Get active session for user with detailed status
router.get("/user/:userAddress", async (req, res) => {
    try {
        const session = await DepositSession.findOne({
            userAddress: req.params.userAddress,
            status: { $in: ["PENDING", "PROCESSING", "COMPLETED"] },
            expiresAt: { $gt: new Date() }
        });

        if (!session) {
            return res.status(404).json({ error: "No active session found" });
        }

        // If session has a transaction hash, check its status
        let txStatus = null;
        if (session.txHash) {
            txStatus = await checkTransactionStatus(session.txHash);
            
            // If transaction is confirmed, update status if needed
            if (txStatus === "CONFIRMED" && session.status === "PROCESSING") {
                session.status = "COMPLETED";
                await session.save();
            }
        }

        // Add transaction status to response
        res.json({
            ...session.toObject(),
            txStatus: txStatus
        });
    } catch (error) {
        console.error("Error fetching session:", error);
        res.status(500).json({ error: "Failed to fetch session" });
    }
});

// Complete deposit session
router.put("/:id/complete", async (req, res) => {
    console.log("=== Starting session completion ===");
    const { id } = req.params;
    const { amount } = req.body;
    
    console.log("Session ID:", id);
    console.log("Amount received:", amount);

    // Add a mutex object to track sessions being processed
    if (!global.processingSessionIds) {
        global.processingSessionIds = new Set();
    }

    // Check if this session is already being processed
    if (global.processingSessionIds.has(id)) {
        console.log("Session is already being processed, skipping duplicate request");
        
        // Return status info for the frontend
        const session = await DepositSession.findById(id);
        if (session) {
            let txStatus = null;
            if (session.txHash) {
                txStatus = await checkTransactionStatus(session.txHash);
            }
            
            return res.status(202).json({ 
                message: "Session is already being processed",
                status: session.status,
                txStatus: txStatus,
                txHash: session.txHash
            });
        }
        
        return res.status(409).json({ message: "Session is already being processed" });
    }

    try {
        // Mark session as being processed
        global.processingSessionIds.add(id);

        // First check if session is already completed
        const existingSession = await DepositSession.findOne({
            _id: id,
            status: "COMPLETED"
        });

        if (existingSession) {
            console.log("Session already completed, skipping");
            global.processingSessionIds.delete(id); // Remove from processing set
            return res.json(existingSession);
        }

        const session = await DepositSession.findById(id);
        console.log("Found session:", {
            id: session?._id,
            userAddress: session?.userAddress,
            status: session?.status,
            expiresAt: session?.expiresAt
        });
        
        if (!session) {
            console.log("Session not found");
            global.processingSessionIds.delete(id); // Remove from processing set
            return res.status(404).json({ error: "Session not found" });
        }

        if (session.status !== "PENDING") {
            console.log("Invalid session status:", session.status);
            global.processingSessionIds.delete(id); // Remove from processing set
            return res.status(400).json({ error: "Session already completed or expired" });
        }

        // Update session status to PROCESSING to prevent race conditions
        session.status = "PROCESSING";
        // Save the amount value here to ensure it's stored
        session.amount = amount;
        await session.save();
        
        console.log("Calling handleTokenTransfer...");
        const result = await handleTokenTransfer(amount, session.userAddress);
        
        if (!result.success) {
            console.error("handleTokenTransfer failed");
            // Revert to PENDING in case of failure, so it can be retried
            session.status = "PENDING";
            await session.save();
            global.processingSessionIds.delete(id); // Remove from processing set
            return res.status(500).json({ error: "Failed to process bridge deposit" });
        }

        // Save transaction hash for status tracking
        if (result.hash) {
            session.txHash = result.hash;
            await session.save();
        }
        
        console.log("Transaction submitted, waiting for confirmation...");
        
        // Start monitoring the transaction confirmation in background
        monitorTransactionConfirmation(session._id, result.hash);
        
        // Return immediately with PROCESSING status
        global.processingSessionIds.delete(id);
        res.json({
            ...session.toObject(),
            txStatus: result.status || "CONFIRMING"
        });
        
    } catch (error) {
        console.error("=== Error in session completion ===");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Stack trace:", error.stack);
        
        // Clean up processing state
        if (id) global.processingSessionIds.delete(id);
        
        // Try to revert session status if we can
        try {
            const session = await DepositSession.findById(id);
            if (session && session.status === "PROCESSING") {
                session.status = "PENDING";
                await session.save();
                console.log("Reverted session status to PENDING after error");
            }
        } catch (dbError) {
            console.error("Failed to revert session status:", dbError);
        }
        
        res.status(500).json({ error: "Failed to complete deposit session" });
    }
});

// Add a function to monitor transaction confirmation in the background
async function monitorTransactionConfirmation(sessionId, txHash) {
    if (!txHash) return;
    
    try {
        console.log(`Monitoring transaction ${txHash} for session ${sessionId}...`);
        
        // Wait for transaction to be confirmed
        const receipt = await provider.waitForTransaction(txHash, 1);
        console.log("Transaction confirmed in block:", receipt.blockNumber);
        
        if (receipt.status === 1) {
            console.log("Transaction successful");
            
            // Update session status
            const session = await DepositSession.findById(sessionId);
            if (session && session.status === "PROCESSING") {
                console.log("Updating session status...");
                session.status = "COMPLETED";
                // No need to update amount here as it's already set when status changed to PROCESSING
                await session.save();
                console.log("Session updated successfully");
            }
        } else {
            console.log("Transaction failed");
            
            // Revert session status to PENDING
            const session = await DepositSession.findById(sessionId);
            if (session && session.status === "PROCESSING") {
                session.status = "PENDING";
                await session.save();
                console.log("Session reverted to PENDING due to failed transaction");
            }
        }
    } catch (error) {
        console.error("Error monitoring transaction confirmation:", error);
    }
}

// Cleanup expired sessions (this could be moved to a separate cron job)
const cleanupExpiredSessions = async () => {
    try {
        await DepositSession.updateMany(
            {
                status: "PENDING",
                expiresAt: { $lt: new Date() }
            },
            {
                status: "EXPIRED"
            }
        );
    } catch (error) {
        console.error("Error cleaning up expired sessions:", error);
    }
};

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

module.exports = router; 