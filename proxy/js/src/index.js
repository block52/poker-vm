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
// 11. Table-related endpoints
// ===================================
app.get("/tables", async (req, res) => {
    const sb = req.query.bb;
    const bb = req.query.sb;

    const query = `sb=${sb}&bb=${bb}`;

    const rpc_request = {
        jsonrpc: "2.0",
        method: "get_player",
        params: [query],
        id: "1"
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
});

app.get("/table/:id/player/:seat", async (req, res) => {
    try {
        const id = req.params.id;
        const seat = req.params.seat;

        const rpc_request = {
            jsonrpc: "2.0",
            method: "get_player",
            params: [id, seat],
            id: "1"
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
        // TODO: HACK - Using timestamp as nonce. Should properly get and validate nonces from account in the future
        const timestampNonce = Date.now().toString();

        // Format the RPC call to match the PERFORM_ACTION structure
        const rpcCall = {
            id: getNextRpcId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [
                req.body.userAddress, // from
                req.params.tableId, // to (using the tableId from URL params)
                NonPlayerActionType.JOIN, // action
                req.body.buyInAmount, // amount
                timestampNonce, // nonce - using timestamp for uniqueness
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
        // TODO: HACK - Using timestamp as nonce. Should properly get and validate nonces from account in the future
        const timestampNonce = Date.now().toString();

        // Format the RPC call to match the PERFORM_ACTION structure
        const rpcCall = {
            id: getNextRpcId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [
                req.body.userAddress, // from
                req.params.tableId, // to (using the tableId from URL params)
                PlayerActionType.SMALL_BLIND, // action
                req.body.amount || req.body.smallBlindAmount || "0", // amount (use amount or smallBlindAmount)
                timestampNonce, // nonce - using timestamp for uniqueness
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
        // TODO: HACK - Using timestamp as nonce. Should properly get and validate nonces from account in the future
        const timestampNonce = Date.now().toString();

        // Format the RPC call to match the PERFORM_ACTION structure
        const rpcCall = {
            id: getNextRpcId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [
                req.body.userAddress, // from
                req.params.tableId, // to (using the tableId from URL params)
                PlayerActionType.BIG_BLIND, // action
                req.body.amount || req.body.bigBlindAmount || "0", // amount (use amount or bigBlindAmount)
                timestampNonce, // nonce - using timestamp for uniqueness
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
        // TODO: HACK - Using timestamp as nonce. Should properly get and validate nonces from account in the future
        const timestampNonce = Date.now().toString();

        // Format the RPC call to match the PERFORM_ACTION structure
        const rpcCall = {
            id: getNextRpcId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [
                req.body.userAddress, // from
                req.params.tableId, // to (table ID)
                PlayerActionType.FOLD, // action
                "0", // amount (folding doesn't require an amount)
                timestampNonce, // nonce - using timestamp for uniqueness
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

// Add new raise endpoint
app.post("/table/:tableId/raise", async (req, res) => {
    console.log("=== RAISE ACTION REQUEST ===");
    console.log("Request body:", req.body);
    console.log("   signature:", req.body.signature);
    console.log("   publicKey:", req.body.publicKey);
    console.log("   action index:", req.body.index || req.body.actionIndex);
    console.log("   raise amount:", req.body.amount);

    try {
        // TODO: HACK - Using timestamp as nonce. Should properly get and validate nonces from account in the future
        const timestampNonce = Date.now().toString();

        // Format the RPC call to match the PERFORM_ACTION structure
        const rpcCall = {
            id: getNextRpcId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [
                req.body.userAddress, // from
                req.params.tableId, // to (table ID)
                PlayerActionType.RAISE, // action
                req.body.amount, // amount to raise
                timestampNonce, // nonce - using timestamp for uniqueness
                req.body.index || req.body.actionIndex // data/index - use the provided index
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
        res.status(500).json({ error: "Failed to raise", details: error.message });
    }
});

// Add bet endpoint
app.post("/table/:tableId/bet", async (req, res) => {
    console.log("=== BET ACTION REQUEST ===");
    console.log("Request body:", req.body);
    console.log("   signature:", req.body.signature);
    console.log("   publicKey:", req.body.publicKey);
    console.log("   action index:", req.body.index || req.body.actionIndex);
    console.log("   bet amount:", req.body.amount);

    try {
        // TODO: HACK - Using timestamp as nonce. Should properly get and validate nonces from account in the future
        const timestampNonce = Date.now().toString();

        // Format the RPC call to match the PERFORM_ACTION structure
        const rpcCall = {
            id: getNextRpcId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [
                req.body.userAddress, // from
                req.params.tableId, // to (table ID)
                PlayerActionType.BET, // action
                req.body.amount, // amount to bet
                timestampNonce, // nonce - using timestamp for uniqueness
                req.body.index || req.body.actionIndex // data/index - use the provided index
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
        res.status(500).json({ error: "Failed to bet", details: error.message });
    }
});

// Add call endpoint
app.post("/table/:tableId/call", async (req, res) => {
    console.log("=== CALL ACTION REQUEST ===");
    console.log("Request body:", req.body);
    console.log("   signature:", req.body.signature);
    console.log("   publicKey:", req.body.publicKey);
    console.log("   action index:", req.body.index || req.body.actionIndex);
    console.log("   call amount:", req.body.amount);

    try {
        // TODO: HACK - Using timestamp as nonce. Should properly get and validate nonces from account in the future
        const timestampNonce = Date.now().toString();

        // Format the RPC call to match the PERFORM_ACTION structure
        const rpcCall = {
            id: getNextRpcId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [
                req.body.userAddress, // from
                req.params.tableId, // to (table ID)
                PlayerActionType.CALL, // action
                req.body.amount, // amount to call
                timestampNonce, // nonce - using timestamp for uniqueness
                req.body.index || req.body.actionIndex // data/index - use the provided index
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
        res.status(500).json({ error: "Failed to call", details: error.message });
    }
});

// Add check endpoint
app.post("/table/:tableId/check", async (req, res) => {
    console.log("=== CHECK ACTION REQUEST ===");
    console.log("Request body:", req.body);
    console.log("   signature:", req.body.signature);
    console.log("   publicKey:", req.body.publicKey);
    console.log("   action index:", req.body.index || req.body.actionIndex);

    try {
        // TODO: HACK - Using timestamp as nonce. Should properly get and validate nonces from account in the future
        const timestampNonce = Date.now().toString();

        // Format the RPC call to match the PERFORM_ACTION structure
        const rpcCall = {
            id: getNextRpcId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [
                req.body.userAddress, // from
                req.params.tableId, // to (table ID)
                PlayerActionType.CHECK, // action
                "0", // amount (check doesn't require an amount)
                timestampNonce, // nonce - using timestamp for uniqueness
                req.body.index || req.body.actionIndex // data/index - use the provided index
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
        res.status(500).json({ error: "Failed to check", details: error.message });
    }
});

app.post("/table/:tableId/leave", async (req, res) => {
    console.log("=== LEAVE TABLE REQUEST ===");
    console.log("Request body:", req.body);
    console.log("   signature:", req.body.signature);
    console.log("   publicKey:", req.body.publicKey);
    console.log("Amount to withdraw on leave:", req.body.amount);

    try {
        // TODO: HACK - Using timestamp as nonce. Should properly get and validate nonces from account in the future
        const timestampNonce = Date.now().toString();

        // Format the RPC call to match the PERFORM_ACTION structure
        const rpcCall = {
            id: getNextRpcId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [
                req.body.userAddress, // from
                req.params.tableId, // to (using the tableId from URL params)
                NonPlayerActionType.LEAVE, // action
                req.body.amount || "0", // amount
                timestampNonce, // nonce - using timestamp for uniqueness
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
    console.log("=== DEAL ACTION REQUEST ===");
    console.log("Request body:", req.body);
    console.log("   signature:", req.body.signature);
    console.log("   publicKey:", req.body.publicKey);
    console.log("   action index:", req.body.index || req.body.actionIndex);

    try {
        // TODO: HACK - Using timestamp as nonce. Should properly get and validate nonces from account in the future
        const timestampNonce = Date.now().toString();

        // Format the RPC call to match the PERFORM_ACTION structure
        const rpcCall = {
            id: getNextRpcId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [
                req.body.userAddress, // from
                req.params.tableId, // to (table ID)
                NonPlayerActionType.DEAL, // action
                "0", // amount (deal doesn't require an amount)
                timestampNonce, // nonce - using timestamp for uniqueness
                req.body.index || req.body.actionIndex // data/index - use the provided index
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
        res.status(500).json({ error: "Failed to deal cards", details: error.message });
    }
});

// ===================================
// New endpoint for get_game_state
// ===================================
app.get("/get_game_state/:tableId", async (req, res) => {
    console.log("=== GET GAME STATE REQUEST ===");
    // console.log("Table ID:", req.params.tableId);
    // console.log("User Address:", req.query.userAddress);

    try {
        // Format the RPC call according to the specified structure
        const rpcCall = {
            id: getNextRpcId(),
            method: "get_game_state",
            version: "2.0",
            params: [req.params.tableId, req.query.userAddress]
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
        console.error("=== ERROR ===");
        console.error("Error details:", error);
        res.status(500).json({
            error: "Failed to get game state",
            details: error.message
        });
    }
});

// ===================================
// New endpoint for creating a new game
// ===================================
app.post("/create_new_game", async (req, res) => {
    console.log("=== CREATE NEW GAME REQUEST ===");
    console.log("Request body:", req.body);
    console.log("   address:", req.body.address);
    console.log("   seed:", req.body.seed || "undefined");

    try {
        // TODO: HACK - This endpoint should also follow proper nonce handling in the future

        // Format the RPC call to match the NEW command structure
        const rpcCall = {
            id: getNextRpcId(),
            method: "new", // Lowercase "new" matches the SDK definition
            params: [
                "0x22dfa2150160484310c5163f280f49e23b8fd34326", // Hardcoded for now to match exactly what's expected
                req.body.seed || ""
            ],
            signature: req.body.signature,
            publicKey: req.body.publicKey
        };

        console.log("=== FORMATTED RPC CALL ===");
        console.log(JSON.stringify(rpcCall, null, 2));
        console.log("=== NODE_URL ===");
        console.log(NODE_URL);

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
        res.status(500).json({
            error: "Failed to create new game",
            details: error.message
        });
    }
});

// ===================================
// New endpoint for mucking cards
// ===================================
app.post("/table/:tableId/muck", async (req, res) => {
    console.log("=== MUCK ACTION REQUEST ===");
    console.log("Request body:", req.body);
    console.log("   signature:", req.body.signature);
    console.log("   publicKey:", req.body.publicKey);
    console.log("   action index:", req.body.index || req.body.actionIndex);

    try {
        // TODO: HACK - Using timestamp as nonce. Should properly get and validate nonces from account in the future
        const timestampNonce = Date.now().toString();

        // Format the RPC call to match the PERFORM_ACTION structure
        const rpcCall = {
            id: getNextRpcId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [
                req.body.userAddress, // from
                req.params.tableId, // to (table ID)
                PlayerActionType.MUCK, // action
                "0", // amount (muck doesn't require an amount)
                timestampNonce, // nonce - using timestamp for uniqueness
                req.body.index || req.body.actionIndex // data/index - use the provided index
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
        res.status(500).json({ error: "Failed to muck cards", details: error.message });
    }
});

// ===================================
// New endpoint for showing cards
// ===================================
app.post("/table/:tableId/show", async (req, res) => {
    console.log("=== SHOW ACTION REQUEST ===");
    console.log("Request body:", req.body);
    console.log("   signature:", req.body.signature);
    console.log("   publicKey:", req.body.publicKey);
    console.log("   action index:", req.body.index || req.body.actionIndex);

    try {
        // TODO: HACK - Using timestamp as nonce. Should properly get and validate nonces from account in the future
        const timestampNonce = Date.now().toString();

        // Format the RPC call to match the PERFORM_ACTION structure
        const rpcCall = {
            id: getNextRpcId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [
                req.body.userAddress, // from
                req.params.tableId, // to (table ID)
                PlayerActionType.SHOW, // action
                "0", // amount (show doesn't require an amount)
                timestampNonce, // nonce - using timestamp for uniqueness
                req.body.index || req.body.actionIndex // data/index - use the provided index
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
        res.status(500).json({ error: "Failed to show cards", details: error.message });
    }
});

// ===================================
// New endpoint for creating a new hand
// ===================================
app.post("/create_new_hand/:tableId", async (req, res) => {
    console.log("=== CREATE NEW HAND REQUEST ===");
    console.log("Request body:", req.body);
    console.log("   table address:", req.params.tableId);
    console.log("   user address:", req.body.userAddress);
    console.log("   nonce:", req.body.nonce);
    console.log("   seed:", req.body.seed);

    try {
        // TODO: HACK - This endpoint should follow proper nonce handling in the future

        // Use the tableId from URL parameters, not request body
        const tableId = req.params.tableId;

        // Format the RPC call to match the NEW command structure
        const rpcCall = {
            id: getNextRpcId(),
            method: "new", // Lowercase "new" matches the SDK definition
            params: [
                tableId, // Use tableId from URL params
                req.body.seed || Math.random().toString(36).substring(2, 15) // Use provided seed or generate random one
            ],
            signature: req.body.signature,
            publicKey: req.body.publicKey
        };

        console.log("=== FORMATTED RPC CALL ===");
        console.log(JSON.stringify(rpcCall, null, 2));

        // Make the actual RPC call to the node
        const response = await axios.post(NODE_URL, rpcCall, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        console.log("=== NODE RESPONSE ===");
        console.log(response.data);

        // After successful creation, trigger a game state refresh
        setTimeout(async () => {
            try {
                console.log("=== TRIGGERING GAME STATE REFRESH ===");
                const gameStateCall = {
                    id: getNextRpcId(),
                    method: "getGameState",
                    params: [tableId], // Use the tableId from URL params
                    publicKey: req.body.publicKey
                };

                await axios.post(NODE_URL, gameStateCall, {
                    headers: { "Content-Type": "application/json" }
                });

                console.log("Game state refresh triggered successfully");
            } catch (refreshError) {
                console.error("Error refreshing game state:", refreshError);
            }
        }, 1000); // Short delay to ensure the change has propagated

        res.json(response.data);
    } catch (error) {
        console.error("=== ERROR ===");
        console.error("Error details:", error);
        res.status(500).json({
            error: "Failed to create new hand",
            details: error.message
        });
    }
});

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
