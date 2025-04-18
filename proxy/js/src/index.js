/**
 * Block52 Proxy Server
 * Main application entry point
 */

// ===================================
// 1. Import Dependencies
// ===================================
const { BigUnit } = require("bigunit");
const express = require("express");
const cors = require("cors");
const ethers = require("ethers");
const dotenv = require("dotenv");
const connectDB = require("./db");
const axios = require("axios");
const depositSessionsRouter = require("./routes/depositSessions");
const swaggerSetup = require("./swagger/setup");

const { RPCMethods, PlayerActionType, NonPlayerActionType } = require("@bitcoinbrisbane/block52");

const { getUnixTime } = require("./utils/helpers");

// Add WebSocket support
const http = require("http");

// ===================================
// 2. Load Environment Configuration
// ===================================
dotenv.config();

const port = process.env.PORT || 8080;

// Use NODE_URL from environment with proper fallback
const NODE_URL = process.env.NODE_URL || "https://node1.block52.xyz";
console.log("Using NODE API URL:", NODE_URL);

// Helper function to generate incrementing RPC IDs
let rpcIdCounter = 0;
const getNextRpcId = () => {
    rpcIdCounter++;
    return rpcIdCounter.toString();
};

// ===================================
// 3. Initialize Client (Singleton)
// ===================================

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

// ===================================
// 6. Database Connection
// ===================================
connectDB()
    .then(() => {
        console.log("MongoDB connection established");
    })
    .catch(err => {
        console.error("MongoDB connection error:", err);
    });

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
app.use("/deposit-sessions", depositSessionsRouter);

// ===================================
// 10. Game lobby-related endpoints
// ===================================
app.get("/games", (req, res) => {
    const id1 = ethers.ZeroAddress;
    const id2 = ethers.ZeroAddress;

    const min = BigUnit.from("0.01", 18).toString();
    const max = BigUnit.from("1", 18).toString();

    const response = [
        { id: id1, variant: "Texas Holdem", type: "Cash", limit: "No Limit", max_players: 9, min, max },
        { id: id2, variant: "Texas Holdem", type: "Cash", limit: "No Limit", max_players: 6, min, max }
    ];

    res.send(response);
});

// ===================================
// 11. Table-related endpoints
// ===================================
app.get("/tables", async (req, res) => {
    res.send("todo: you need to wire this up");
});

app.get("/table/:id/player/:seat", async (req, res) => {
    try {
        const id = req.params.id;
        const seat = req.params.seat;

        const rpc_request = {
            jsonrpc: "2.0",
            method: "get_player",
            params: [id, seat],
            id: Math.floor(Math.random() * 10000) // Simple request ID for the time being
        };

        const response = await axios.post(NODE_URL, rpc_request, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        const data = response.data;

        if (data.error) {
            return res.send(null);
        }

        res.send(data.result);
    } catch (error) {
        console.error("Error fetching player:", error);
        res.send(null);
    }
});

// Create HTTP server instead of directly using app.listen
const server = http.createServer(app);

// ===================================
// 12. Join table endpoint
// ===================================
app.post("/table/:tableId/join", async (req, res) => {
    console.log("=== JOIN TABLE REQUEST ===");
    console.log("Request body:", req.body);
    console.log("   signature:", req.body.signature);
    console.log("   publicKey:", req.body.publicKey);
    console.log("Buy in amount on join:", req.body.buyInAmount);

    try {
        // Format the RPC call to match the PERFORM_ACTION structure
        const rpcCall = {
            id: getNextRpcId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [
                req.body.userAddress, // from
                req.params.tableId, // to (using the tableId from URL params)
                NonPlayerActionType.JOIN, // action
                req.body.buyInAmount, // amount
                req.body.nonce || 0, // nonce (optional)
                req.body.index
            ],
            signature: req.body.signature,
            publicKey: req.body.publicKey
        };

        console.log("=== FORMATTED RPC CALL ===");
        console.log(JSON.stringify(rpcCall, null, 2));
        console.log("=== NODE_URL ===");
        console.log(process.env.NODE_URL);

        // Make the actual RPC call to the node
        const response = await axios.post(NODE_URL, rpcCall, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        console.log("=== NODE RESPONSE ===");
        console.log(response.data);

        res.json(response.data);
    } catch (error) {
        console.error("=== ERROR ===");
        console.error("Error details:", error);
        res.status(500).json({ error: "Failed to join table", details: error.message });
    }
});

// Post small blind endpoint
app.post("/table/:tableId/post_small_blind", async (req, res) => {
    console.log("=== POST SMALL BLIND REQUEST ===");
    console.log("Request body:", req.body);
    console.log("   signature:", req.body.signature);
    console.log("   publicKey:", req.body.publicKey);
    console.log("   action index:", req.body.index);
    console.log("Small blind amount:", req.body.amount || req.body.smallBlindAmount);

    try {
        // Format the RPC call to match the PERFORM_ACTION structure
        // Parameter order in RPC call must match:
        // 1. The RPC creates PerformActionCommand(from, to, data/index, amount, action, ...)
        // 2. Then PerformActionCommand calls game.performAction(from, action, index, amount)
        const rpcCall = {
            id: getNextRpcId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [
                req.body.userAddress, // from
                req.params.tableId, // to (using the tableId from URL params)
                PlayerActionType.SMALL_BLIND, // action
                req.body.amount || req.body.smallBlindAmount || "0", // amount (use amount or smallBlindAmount)
                req.body.nonce || 0, // nonce (optional)
                req.body.index // data/index - use the provided index
            ],
            signature: req.body.signature,
            publicKey: req.body.publicKey
        };

        console.log("=== FORMATTED RPC CALL ===");
        console.log(JSON.stringify(rpcCall, null, 2));
        console.log("=== NODE_URL ===");
        console.log(process.env.NODE_URL);

        // Make the actual RPC call to the node
        const response = await axios.post(NODE_URL, rpcCall, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        console.log("=== NODE RESPONSE ===");
        console.log(response.data);

        res.json(response.data);
    } catch (error) {
        console.error("=== ERROR ===");
        console.error("Error details:", error);
        res.status(500).json({ error: "Failed to post small blind", details: error.message });
    }
});

// Post big blind endpoint
app.post("/table/:tableId/post_big_blind", async (req, res) => {
    console.log("=== POST BIG BLIND REQUEST ===");
    console.log("Request body:", req.body);
    console.log("   signature:", req.body.signature);
    console.log("   publicKey:", req.body.publicKey);
    console.log("   action index:", req.body.index);
    console.log("Big blind amount:", req.body.amount || req.body.bigBlindAmount);

    try {
        // Format the RPC call to match the PERFORM_ACTION structure
        // Parameter order in RPC call must match:
        // 1. The RPC creates PerformActionCommand(from, to, data/index, amount, action, ...)
        // 2. Then PerformActionCommand calls game.performAction(from, action, index, amount)
        const rpcCall = {
            id: getNextRpcId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [
                req.body.userAddress, // from
                req.params.tableId, // to (using the tableId from URL params)
                PlayerActionType.BIG_BLIND, // action
                req.body.amount || req.body.bigBlindAmount || "0", // amount (use amount or bigBlindAmount)
                req.body.nonce || 0, // nonce (optional)
                req.body.index // data/index - use the provided index
            ],
            signature: req.body.signature,
            publicKey: req.body.publicKey
        };

        console.log("=== FORMATTED RPC CALL ===");
        console.log(JSON.stringify(rpcCall, null, 2));
        console.log("=== NODE_URL ===");
        console.log(process.env.NODE_URL);

        // Make the actual RPC call to the node
        const response = await axios.post(NODE_URL, rpcCall, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        console.log("=== NODE RESPONSE ===");
        console.log(response.data);

        res.json(response.data);
    } catch (error) {
        console.error("=== ERROR ===");
        console.error("Error details:", error);
        res.status(500).json({ error: "Failed to post big blind", details: error.message });
    }
});

app.post("/table/:tableId/fold", async (req, res) => {
    console.log("=== FOLD ACTION REQUEST ===");
    console.log("Request body:", req.body);
    console.log("   signature:", req.body.signature);
    console.log("   publicKey:", req.body.publicKey);
    console.log("   action index:", req.body.index);

    try {
        // Format the RPC call to match the PERFORM_ACTION structure
        const rpcCall = {
            id: getNextRpcId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [
                req.body.userAddress, // from
                req.params.tableId, // to (table ID)
                "fold", // action
                "0", // amount (folding doesn't require an amount)
                req.body.nonce || 0, // nonce (optional)
                req.body.index // data/index - use the provided index or default to 1 based on game state
            ],
            signature: req.body.signature,
            publicKey: req.body.publicKey
        };

        console.log("=== FORMATTED RPC CALL ===");
        console.log(JSON.stringify(rpcCall, null, 2));
        console.log("=== NODE_URL ===");
        console.log(process.env.NODE_URL);

        // Make the actual RPC call to the node
        const response = await axios.post(NODE_URL, rpcCall, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        console.log("=== NODE RESPONSE ===");
        console.log(response.data);

        res.json(response.data);
    } catch (error) {
        console.error("=== ERROR ===");
        console.error("Error details:", error);
        res.status(500).json({ error: "Failed to fold", details: error.message });
    }
});

app.post("/table/:tableId/leave", async (req, res) => {
    console.log("=== LEAVE TABLE REQUEST ===");
    console.log("Request body:", req.body);
    console.log("   signature:", req.body.signature);
    console.log("   publicKey:", req.body.publicKey);
    console.log("Amount to withdraw on leave:", req.body.amount);

    try {
        // Format the RPC call to match the PERFORM_ACTION structure
        const rpcCall = {
            id: getNextRpcId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [
                req.body.userAddress, // from
                req.params.tableId, // to (using the tableId from URL params)
                NonPlayerActionType.LEAVE, // action
                req.body.amount || "0", // amount
                req.body.nonce || 0, // nonce (optional)
                req.body.index
            ],
            signature: req.body.signature,
            publicKey: req.body.publicKey
        };

        console.log("=== FORMATTED RPC CALL ===");
        console.log(JSON.stringify(rpcCall, null, 2));
        console.log("=== NODE_URL ===");
        console.log(process.env.NODE_URL);

        // Make the actual RPC call to the node
        const response = await axios.post(NODE_URL, rpcCall, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        console.log("=== NODE RESPONSE ===");
        console.log(response.data);

        res.json(response.data);
    } catch (error) {
        console.error("=== ERROR ===");
        console.error("Error details:", error);
        res.status(500).json({ error: "Failed to leave table", details: error.message });
    }
});




// ===================================
// 13. Account-related endpoints
// ===================================
app.get("/get_account/:accountId", async (req, res) => {
    try {
        // Format the RPC call using the shared type
        const rpcCall = {
            id: getNextRpcId(),
            method: RPCMethods.GET_ACCOUNT,
            version: "2.0",
            params: [req.params.accountId]
        };

        // Make the actual RPC call to the node
        const response = await axios.post(NODE_URL, rpcCall, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({
            error: "Failed to get account",
            details: error.message
        });
    }
});

// System utility endpoints
app.get("/time", (req, res) => {
    // Return the current time in UNIX format
    const response = {
        time: getUnixTime()
    };

    res.send(response);
});

app.get("/nonce/:address", async (req, res) => {
    // console.log("\n=== Nonce Request ===");
    // console.log("Address:", req.params.address);

    try {
        // Format the RPC call according to the specified structure
        const rpcCall = {
            id: getNextRpcId(),
            method: "get_account",
            version: "2.0",
            params: [req.params.address]
        };

        // console.log("=== FORMATTED RPC CALL ===");
        // console.log(JSON.stringify(rpcCall, null, 2));
        // console.log("=== NODE_URL ===");
        // console.log(process.env.NODE_URL);

        // Make the actual RPC call to the node
        const response = await axios.post(NODE_URL, rpcCall, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        // console.log("=== NODE RESPONSE ===");
        // console.log(response.data);

        // Extract the account data from the response
        const accountData = response.data.result.data;
        const signature = response.data.result.signature;

        // Clean response with no duplicates
        const formattedResponse = {
            result: {
                data: {
                    address: accountData.address,
                    balance: accountData.balance || "0",
                    nonce: accountData.nonce || 0
                },
                signature: signature
            },
            timestamp: getUnixTime()
        };

        // console.log("Clean nonce response:", formattedResponse);
        res.json(formattedResponse);
    } catch (error) {
        console.error("Error getting nonce:", error);
        res.status(500).json({
            error: "Failed to get nonce",
            details: error.message
        });
    }
});

// ===================================
// Deal cards endpoint
// ===================================
app.post("/table/:tableId/deal", async (req, res) => {
    // console.log("=== DEAL CARDS REQUEST ===");
    // console.log("Request body:", req.body);
    // console.log("Route params:", req.params);

    try {
        // Format the RPC call to match the SDK client structure
        const rpcCall = {
            id: getNextRpcId(),
            version: "2.0",
            method: "deal",
            params: [
                req.params.tableId, // table address
                req.body.seed || "randomseed123", // random seed (use provided or default) todo: this should be the seed from the game
                req.body.publicKey // public key
            ],
            signature: req.body.signature
        };

        // console.log("=== FORMATTED RPC CALL ===");
        // console.log(JSON.stringify(rpcCall, null, 2));
        // console.log("=== NODE_URL ===");
        // console.log(process.env.NODE_URL);

        // Make the actual RPC call to node1
        const response = await axios.post(NODE_URL, rpcCall, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        // console.log("=== NODE1 RESPONSE ===");
        // console.log(response.data);

        res.json(response.data);

        // // Also broadcast this update to WebSocket clients
        // if (tableSubscriptions.has(req.params.tableId)) {
        //     console.log(`Broadcasting table update after deal to ${tableSubscriptions.get(req.params.tableId).size} WebSocket clients`);
        //     await broadcastTableUpdate(req.params.tableId);
        // }
    } catch (error) {
        // console.error("=== ERROR ===");
        // console.error("Error details:", error);
        res.status(500).json({ error: "Failed to deal cards", details: error.message });
    }
});

// ===================================
// New endpoint for get_game_state
// ===================================
app.get("/get_game_state/:tableId", async (req, res) => {
    // console.log("=== GET GAME STATE REQUEST ===");
    // console.log("Table ID:", req.params.tableId);

    try {
        // Format the RPC call according to the specified structure
        const rpcCall = {
            id: getNextRpcId(),
            method: "get_game_state",
            version: "2.0",
            params: [req.params.tableId]
        };

        // console.log("=== FORMATTED RPC CALL ===");
        // console.log(JSON.stringify(rpcCall, null, 2));
        // console.log("=== NODE_URL ===");
        // console.log(process.env.NODE_URL);

        // Make the actual RPC call to the node
        const response = await axios.post(NODE_URL, rpcCall, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        // console.log("=== NODE RESPONSE ===");
        // console.log(response.data.result);

        res.json(response.data.result);
    } catch (error) {
        // console.error("=== ERROR ===");
        // console.error("Error details:", error);
        res.status(500).json({
            error: "Failed to get game state",
            details: error.message
        });
    }
});

// ===================================
// New endpoint for get_account
// ===================================

// ===================================
// 14. Start Server
// ===================================
server.listen(port, "0.0.0.0", () => {
    // console.log(`
    // ====================================
    // 🚀 Server is running
    // 📡 Port: ${port}
    // 🌍 URL: http://localhost:${port}
    // 📚 Docs: http://localhost:${port}/docs
    // ====================================
    // `);
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
module.exports = { app, server };
