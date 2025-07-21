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
const connectDB = require("./db");

const swaggerSetup = require("./swagger/setup");

// const depositSessionsRouter = require("./routes/depositSessions");
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
        origin: ["https://app.block52.xyz", "http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
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
// Base route for health check
app.get("/", (req, res) => {
    res.send("Hello World!");
});

// Mount feature-specific routes
// app.use("/deposit-sessions", depositSessionsRouter);
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
