const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const DepositSession = require('../models/depositSession');
console.log('DepositSession model:', DepositSession);

// Update contract addresses to mainnet
const DEPOSIT_ADDRESS = "0xADB8401D85E203F101aC715D5Aa7745a0ABcd42C";  // Your mainnet deposit contract

// Using Sepolia RPC URL from hardhat.config.ts
const RPC_URL = "https://mainnet.infura.io/v3/4a91824fbc7d402886bf0d302677153f";
const PRIVATE_KEY = process.env.DEPOSIT_PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Add this function to handle the token transfer
async function handleTokenTransfer(amount, userAddress) {
    console.log('=== Starting handleTokenTransfer ===');
    console.log('Amount:', amount.toString());
    console.log('User Address:', userAddress);

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

    try {
        const wallet = new ethers.Wallet(process.env.DEPOSIT_PRIVATE_KEY, provider);
        
        // Create contract instance with interface
        const depositContract = new ethers.Contract(
            DEPOSIT_ADDRESS,
            depositInterface,
            wallet
        );

        console.log('Attempting forwardDepositUnderlying with:');
        console.log('- User:', userAddress);
        console.log('- Amount:', amount);

        // Call the contract function
        const tx = await depositContract.forwardDepositUnderlying(
            userAddress,
            amount,
            {
                gasLimit: 300000
            }
        );
        
        console.log('Transaction hash:', tx.hash);
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);
        
        if (receipt.status === 1) {
            console.log('Transaction successful');
            return true;
        } else {
            console.log('Transaction failed');
            return false;
        }
    } catch (error) {
        console.error('=== Error in handleTokenTransfer ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        if (error.transaction) {
            console.error('Transaction details:', {
                from: error.transaction.from,
                to: error.transaction.to,
                data: error.transaction.data
            });
        }
        return false;
    }
}

// Create deposit session
router.post("/", async (req, res) => {
    console.log('Received deposit session request:', req.body);
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
        console.log('Created new session:', session);
        res.status(201).json(session);
    } catch (error) {
        console.error('Error creating deposit session:', error);
        res.status(500).json({ error: "Failed to create deposit session" });
    }
});

// Get active session for user
router.get("/user/:userAddress", async (req, res) => {
    try {
        const session = await DepositSession.findOne({
            userAddress: req.params.userAddress,
            status: "PENDING",
            expiresAt: { $gt: new Date() }
        });

        if (!session) {
            return res.status(404).json({ error: "No active session found" });
        }

        res.json(session);
    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({ error: "Failed to fetch session" });
    }
});

// Complete deposit session
router.put("/:id/complete", async (req, res) => {
    console.log('=== Starting session completion ===');
    const { id } = req.params;
    const { amount } = req.body;
    
    console.log('Session ID:', id);
    console.log('Amount received:', amount);

    try {
        // First check if session is already completed
        const existingSession = await DepositSession.findOne({
            _id: id,
            status: "COMPLETED"
        });

        if (existingSession) {
            console.log('Session already completed, skipping');
            return res.json(existingSession);
        }

        const session = await DepositSession.findById(id);
        console.log('Found session:', {
            id: session?._id,
            userAddress: session?.userAddress,
            status: session?.status,
            expiresAt: session?.expiresAt
        });
        
        if (!session) {
            console.log('Session not found');
            return res.status(404).json({ error: "Session not found" });
        }

        if (session.status !== "PENDING") {
            console.log('Invalid session status:', session.status);
            return res.status(400).json({ error: "Session already completed or expired" });
        }

        console.log('Calling handleTokenTransfer...');
        const success = await handleTokenTransfer(amount, session.userAddress);
        
        if (!success) {
            console.error('handleTokenTransfer failed');
            return res.status(500).json({ error: "Failed to process bridge deposit" });
        }

        console.log('Updating session status...');
        session.status = "COMPLETED";
        session.amount = amount;
        await session.save();
        console.log('Session updated successfully');

        res.json(session);
    } catch (error) {
        console.error('=== Error in session completion ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: "Failed to complete deposit session" });
    }
});

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
        console.error('Error cleaning up expired sessions:', error);
    }
};

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

module.exports = router; 