/**
 * Block52 Proxy Server
 * Main application entry point
 */

// ===================================
// 1. Import Dependencies
// ===================================
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const connectDB = require("./db");
const packageJson = require("../package.json");

const swaggerSetup = require("./swagger/setup");

const depositSessionsRouter = require("./routes/depositSessions");
const bitcoinWebhooksRouter = require("./bitcoin/webhooks/btcpayWebhook");

// ===================================
// 2. Load Environment Configuration
// ===================================
dotenv.config();
const port = process.env.PORT || 8080;

// Use NODE_URL from environment with proper fallback
const NODE_URL = process.env.NODE_URL || "https://node1.block52.xyz";
console.log("Using NODE API URL:", NODE_URL);

// ===================================
// 4. Initialize Express Application
// ===================================
const app = express();

// ===================================
// 5. Configure Middleware
// ===================================
// Enable CORS for all routes
app.use(
    cors({
        origin: ["https://app.block52.xyz", "http://localhost:8545", "http://localhost:3001", "http://localhost:3002"],
        methods: ["GET", "POST", "OPTIONS", "PUT"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);
// Parse JSON bodies
app.use(express.json());

// // ===================================
// // 6. Database Connection
// // ===================================
// connectDB()
//     .then(() => {
//         console.log("MongoDB connection established");
//     })
//     .catch(err => {
//         console.error("MongoDB connection error:", err);
//     });

// ===================================
// 7. Configure API Documentation
// ===================================
// Setup Swagger
swaggerSetup(app);

// ===================================
// 8. Register Routes
// ===================================
// Base route
app.get("/", (req, res) => {
    res.send(`Block52 Proxy v${packageJson.version}`);
});

// Version endpoint
app.get("/version", (req, res) => {
    res.json({
        name: packageJson.name,
        version: packageJson.version,
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint - checks proxy and PVM status
app.get("/health", async (req, res) => {
    const PVM_URL = process.env.PVM_URL || "http://localhost:8545";

    const health = {
        status: "healthy",
        version: packageJson.version,
        timestamp: new Date().toISOString(),
        services: {
            proxy: { status: "healthy", version: packageJson.version }
        }
    };

    // Check PVM health
    try {
        const pvmResponse = await axios.get(`${PVM_URL}/health`, { timeout: 5000 });
        health.services.pvm = {
            status: pvmResponse.data.status || "healthy",
            version: pvmResponse.data.version || "unknown"
        };
    } catch (error) {
        health.services.pvm = {
            status: "unhealthy",
            error: error.message
        };
        health.status = "degraded";
    }

    const statusCode = health.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(health);
});

// Mount feature-specific routes
app.use("/deposit-sessions", depositSessionsRouter);
app.use("/bitcoin", bitcoinWebhooksRouter);

// ===================================
// 14. Start Server
// ===================================
app.listen(port, "0.0.0.0", () => {
    console.log(`
    ====================================
    🚀 Server is running
    📡 Port: ${port}
    🌍 URL: http://localhost:${port}
    📚 Docs: http://localhost:${port}/docs
    ====================================
    `);
});

// ===================================
// 15. Handle Process Events
// ===================================
process.on("SIGTERM", () => {
    // console.log("SIGTERM signal received: closing HTTP server");
    // Perform cleanup here
    process.exit(0);
});

process.on("uncaughtException", err => {
    console.error("Uncaught Exception:", err);
    // Perform cleanup here
    process.exit(1);
});

// Make sure to export the server variable
module.exports = { app };
