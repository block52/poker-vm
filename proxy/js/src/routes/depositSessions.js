const express = require('express');
const router = express.Router();
const DepositSession = require('../models/depositSession');

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
    const { id } = req.params;
    const { amount } = req.body;

    try {
        const session = await DepositSession.findById(id);
        
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        if (session.status !== "PENDING") {
            return res.status(400).json({ error: "Session already completed or expired" });
        }

        session.status = "COMPLETED";
        session.amount = amount;
        await session.save();

        res.json(session);
    } catch (error) {
        console.error('Error completing deposit session:', error);
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