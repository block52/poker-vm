const express = require("express");
const app = express();
const dotenv = require("dotenv");
const logger = require("./config/logger");
const pvmService = require("./services/pvm.service");
const { BlockDTO, TransactionDTO } = require("@bitcoinbrisbane/block52");
const Block = require("./models/block.model");
const blockService = require("./services/block.service");
const connectDatabase = require("./config/database");
dotenv.config();
const cors = require("cors");

app.use(
    cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type"]
    })
);

const PORT = process.env.PORT || 3800;

// Middleware to log all requests
app.use((req, res, next) => {
    logger.info(`Incoming ${req.method} request to ${req.url}`, {
        method: req.method,
        url: req.url,
        query: req.query,
        params: req.params,
        ip: req.ip
    });
    next();
});

// Hello World GET route
app.get("/", (req, res) => {
    logger.debug("Processing root route request");
    res.send("Hello World!");
});

app.get("/block/:hash", async (req, res) => {
    try {
        logger.info("Fetching block by hash", { blockHash: req.params.hash });

        const block = await blockService.getBlockByHash(req.params.hash);

        if (!block) {
            return res.status(404).json({ error: "Block not found" });
        }

        res.json(block);
    } catch (error) {
        logger.error("Error fetching block:", {
            blockHash: req.params.hash,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/blocks", async (req, res) => {
    try {
        logger.info("Fetching blocks list", { query: req.query });

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const sort = req.query.sort || "-index";
        const skip = (page - 1) * limit;

        const result = await blockService.getBlocks(skip, limit, sort);
        res.json(result);
    } catch (error) {
        logger.error("Error fetching blocks:", {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error("Unhandled error:", {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    res.status(500).json({ error: "Internal Server Error" });
});

// Initialize database and start server
const startServer = async () => {
    try {
        // Connect to database first
        const dbConnected = await connectDatabase();
        if (!dbConnected) {
            logger.error("Failed to connect to database. Exiting...");
            process.exit(1);
        }

        // Start the server only after successful DB connection
        app.listen(PORT, () => {
            logger.info(`B52 Explorer server started`, {
                port: PORT,
                environment: process.env.NODE_ENV || "development",
                nodeVersion: process.version
            });

            // Start block synchronization only after server is running
            pvmService.startBlockSync().catch(error => {
                logger.error("Failed to start block sync:", {
                    error: error.message,
                    stack: error.stack
                });
            });
        });
    } catch (error) {
        logger.error("Failed to start server:", {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
};

startServer();

// Handle uncaught exceptions
process.on("uncaughtException", error => {
    logger.error("Uncaught Exception:", {
        error: error.message,
        stack: error.stack
    });
    process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection:", {
        reason: reason,
        stack: reason.stack
    });
});
