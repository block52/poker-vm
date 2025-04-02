const express = require("express");
const app = express();
const dotenv = require("dotenv");
const logger = require("./config/logger");

const { BlockDTO, TransactionDTO } = require("@bitcoinbrisbane/block52");

dotenv.config();
const cors = require("cors");
const rpcService = require("./services/rpc.service");

app.use(
    cors({
        origin: ["https://explorer.block52.xyz", "http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type"]
    })
);

const PORT = process.env.PORT || 9090;

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

app.get("/rpc/blocks", async (req, res) => {
    try {
        logger.info("Fetching blocks directly from RPC");
        const blocks = await rpcService.getBlocks();

        if (!blocks) {
            return res.status(404).json({ error: "Blocks not found via RPC" });
        }

        res.json(blocks);
    } catch (error) {
        logger.error("Error fetching blocks from RPC:", {
            error: error.message
        });
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/rpc/block/:index", async (req, res) => {
    try {
        logger.info("Fetching block directly from RPC", { blockIndex: req.params.index });
        const block = await rpcService.getBlock(parseInt(req.params.index));

        if (!block) {
            return res.status(404).json({ error: "Block not found via RPC" });
        }

        res.json(block);
    } catch (error) {
        logger.error("Error fetching block from RPC:", {
            blockIndex: req.params.index,
            error: error.message
        });
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ================================
// old routes
// ================================

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

        // Start the server only after successful DB connection
        app.listen(PORT, () => {
            logger.info(`B52 Explorer server started`, {
                port: PORT
            });

            // Start block synchronization only after server is running
            // pvmService.startBlockSync().catch(error => {
            //     logger.error("Failed to start block sync:", {
            //         error: error.message,
            //         stack: error.stack
            //     });
            // });
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
