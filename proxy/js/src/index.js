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
const Block52 = require("./clients/block52");
const { NodeRpcClient, RPCMethods } = require("@bitcoinbrisbane/block52");

const { getUnixTime } = require("./utils/helpers");

// Add WebSocket support
const WebSocket = require("ws");
const http = require("http");

// ===================================
// 2. Load Environment Configuration
// ===================================
dotenv.config();
const clientType = "block52";
const port = process.env.PORT || 8080;

// ===================================
// 3. Initialize Client (Singleton)
// ===================================
let clientInstance = null;
const getClient = () => {
    if (clientInstance) {
        return clientInstance;
    }

    if (clientType === "block52") {
        const node_url = process.env.NODE_URL || "https://node1.block52.xyz/";
        console.log("Using Block52 client with node URL:", node_url);
        return (clientInstance = new Block52(node_url));
    }

    throw new Error("Client type not found");
};

// Initialize the client once at startup
getClient();

// Add this debug log
console.log(`Configured client: ${clientType}, NODE_URL: ${process.env.NODE_URL || "using default"}`);

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
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);
// Parse JSON bodies
app.use(express.json());

// ===================================
// 6. Database Connection
// ===================================
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
app.use("/deposit-sessions", depositSessionsRouter);

// ===================================
// 9. Generic RPC endpoint
// ===================================
app.get("/rpc", async (req, res) => {
    console.log("=== RPC REQUEST ===");
    console.log("Request body:", req.body);

    try {
        /* Example RPC call for joining a table:
        {
            "id": "1",
            "version": "2.0",
            "method": "transfer",
            "params": [
                "0x123...789",  // Player's address
                "0xabc...def",  // Table address
                "1000000000",   // Buy in amount
                "join"
            ],
            "signature": "0xf65ac7f...",  // Player's signature
            "publicKey": "0x789...def"    // Player's public key
        }

        // Example RPC call for creating a table:
        {
            "method": "create_contract_schema",
            "version": "2.0",
            "id": "1",
            "params": [
                "texas-holdem", 
                "cash", 
                "no-limit", 
                "2", 
                "9", 
                "1000000000000000000000", 
                "300000000000000000000"
            ]
        }
        */
       console.log("=== RPC REQUEST ===");
       console.log(req.body);

        const response = await axios.post(process.env.NODE_URL || "https://node1.block52.xyz", req.body, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        console.log("=== NODE1 RESPONSE ===");
        console.log(response.data);

        res.json(response.data);
    } catch (error) {
        console.error("=== RPC ERROR ===");
        console.error("Error details:", error);
        res.status(500).json({
            error: "RPC call failed",
            details: error.message
        });
    }
});

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
    const client = getClient();
    const table = await client.getTables();

    res.send(table);
});

app.get("/table/:id/player/:seat", (req, res) => {
    const client = getClient();
    const id = req.params.id;
    const seat = req.params.seat;
    const player = client.getPlayer(id, seat);

    res.send(player);
});

// Create HTTP server instead of directly using app.listen
const server = http.createServer(app);

// Create WebSocket server with proper CORS handling
const wss = new WebSocket.Server({
    server,
    path: "/ws",
    // Add proper verification for CORS
    verifyClient: info => {
        const origin = info.origin || info.req.headers.origin;
        const allowedOrigins = ["https://app.block52.xyz", "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:8080"];

        if (allowedOrigins.includes(origin)) {
            console.log(`Accepted WebSocket connection from origin: ${origin}`);
            return true;
        }

        console.log(`Rejected WebSocket connection from origin: ${origin}`);
        return false;
    }
});

// Add more detailed error logging
wss.on("error", error => {
    console.error("WebSocket server error:", error);
});

// Keep track of table subscriptions
const tableSubscriptions = new Map();

// Function to send table state to a specific client
async function sendTableState(tableId, ws) {
    try {
        console.log(`Fetching table state for ${tableId} to send via WebSocket`);
        
        // Use the existing client instance instead of creating a new one
        const client = getClient();
        
        // Or if you need to use NodeRpcClient specifically, add proper error handling:
        // const client = new NodeRpcClient(
        //     process.env.NODE_URL || "https://node1.block52.xyz/", 
        //     process.env.VALIDATOR_KEY || ""
        // );
        
        const table = await client.getGameState(tableId);

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(
                JSON.stringify({
                    type: "tableUpdate",
                    data: table
                })
            );
            console.log(`Sent table state for ${tableId} via WebSocket`);
        } else {
            console.log(`WebSocket not open, skipping table state send for ${tableId}`);
        }
    } catch (error) {
        console.error("Error fetching table state for WebSocket:", error);
        
        // Send an error message to the client so they know to fall back to polling
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: "error",
                message: "Failed to fetch table state"
            }));
        }
    }
}

// WebSocket connection handler - simplified for debugging
wss.on("connection", (ws, req) => {
    console.log("WebSocket client connected from", req.socket.remoteAddress);
    console.log("WebSocket connection headers:", req.headers);

    // Send a welcome message immediately
    try {
        ws.send(
            JSON.stringify({
                type: "welcome",
                message: "Connected to WebSocket server"
            })
        );
        console.log("Sent welcome message");
    } catch (error) {
        console.error("Error sending welcome message:", error);
    }

    let subscribedTableId = null;

    // Handle messages from clients
    ws.on("message", message => {
        try {
            console.log("Raw message received:", message.toString());
            const data = JSON.parse(message.toString());
            console.log("WebSocket message received:", data);

            // Handle subscription requests
            if (data.type === "subscribe" && data.tableId) {
                subscribedTableId = data.tableId;
                console.log(`Client subscribed to table: ${subscribedTableId}`);

                // Add this connection to the table's subscription list
                if (!tableSubscriptions.has(subscribedTableId)) {
                    tableSubscriptions.set(subscribedTableId, new Set());
                }
                tableSubscriptions.get(subscribedTableId).add(ws);

                // Send confirmation to client
                ws.send(
                    JSON.stringify({
                        type: "subscribed",
                        tableId: subscribedTableId
                    })
                );

                // Send initial table state
                sendTableState(subscribedTableId, ws);
            }
        } catch (error) {
            console.error("Error processing WebSocket message:", error);
        }
    });

    // Handle disconnection
    ws.on("close", (code, reason) => {
        console.log("WebSocket client disconnected with code:", code, "reason:", reason || "No reason provided");
        if (subscribedTableId && tableSubscriptions.has(subscribedTableId)) {
            tableSubscriptions.get(subscribedTableId).delete(ws);

            // Clean up empty subscription sets
            if (tableSubscriptions.get(subscribedTableId).size === 0) {
                tableSubscriptions.delete(subscribedTableId);
            }
        }
    });

    // Handle errors
    ws.on("error", error => {
        console.error("WebSocket connection error:", error);
    });
});

// Heartbeat interval to keep connections alive
const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) {
            console.log("Terminating inactive WebSocket connection");
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

// Clean up interval on server close
wss.on("close", function close() {
    clearInterval(interval);
});

// Function to broadcast table updates to all subscribed clients
async function broadcastTableUpdate(tableId) {
    if (!tableSubscriptions.has(tableId)) return;

    try {
        const client = new NodeRpcClient(process.env.NODE_URL || "http://localhost:3000", process.env.VALIDATOR_KEY || "");
        const table = await client.getGameState(tableId);

        const subscribers = tableSubscriptions.get(tableId);
        const message = JSON.stringify({
            type: "tableUpdate",
            data: table
        });

        for (const client of subscribers) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        }
    } catch (error) {
        console.error("Error broadcasting table update:", error);
    }
}

// Modify the existing table endpoint to also broadcast updates
app.get("/table/:id", async (req, res) => {
    console.log("=== TABLE REQUEST ===");
    console.log("Route params:", req.params);

    const id = req.params.id;
    console.log(`Fetching table with ID: ${id}`);

    try {
        const client = new NodeRpcClient(process.env.NODE_URL || "http://localhost:3000", process.env.VALIDATOR_KEY || "");
        const table = await client.getGameState(id);

        res.send(table);

        // Also broadcast this update to WebSocket clients
        if (tableSubscriptions.has(id)) {
            console.log(`Broadcasting table update to ${tableSubscriptions.get(id).size} WebSocket clients`);
            for (const client of tableSubscriptions.get(id)) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(
                        JSON.stringify({
                            type: "tableUpdate",
                            data: table
                        })
                    );
                }
            }
        }
    } catch (error) {
        console.error("=== TABLE ERROR ===");
        console.error("Error details:", error);
        res.status(500).json({
            error: "Failed to fetch table",
            details: error.message
        });
    }
});

// Add a new endpoint to trigger table updates (can be called by the game server when state changes)
app.post("/notify-table-update/:id", async (req, res) => {
    const tableId = req.params.id;
    console.log(`Received update notification for table: ${tableId}`);

    // Broadcast the update to all subscribed clients
    await broadcastTableUpdate(tableId);

    res.status(200).json({ success: true });
});

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
        // Format the RPC call to match the SDK client structure
        const rpcCall = {
            id: "1",
            method: RPCMethods.TRANSFER,
            params: [req.body.userAddress, req.body.tableId, req.body.buyInAmount, "join"],
            signature: req.body.signature,
            publicKey: req.body.publicKey
        };

        console.log("=== FORMATTED RPC CALL ===");
        console.log(JSON.stringify(rpcCall, null, 2));
        console.log("=== NODE_URL ===");
        console.log(process.env.NODE_URL);

        // Make the actual RPC call to node1
        const response = await axios.post(process.env.NODE_URL, rpcCall, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        console.log("=== NODE1 RESPONSE ===");
        console.log(response.data);

        res.json(response.data);
    } catch (error) {
        console.error("=== ERROR ===");
        console.error("Error details:", error);
        res.status(500).json({ error: "Failed to join table", details: error.message });
    }
});

// ===================================
// Player action endpoint
// ===================================
app.post("/table/:tableId/playeraction", async (req, res) => {
    console.log("=== PLAYER ACTION REQUEST ===");
    console.log("Request body:", req.body);
    console.log("Route params:", req.params);

    try {
        // Format the RPC call to match the SDK client structure
        const rpcCall = {
            id: "1",
            method: RPCMethods.TRANSFER,
            params: [
                req.body.userAddress, // player address
                req.params.tableId, // table address
                req.body.amount, // amount
                req.body.action // action (check, call, raise, fold)
            ],
            signature: req.body.signature,
            publicKey: req.body.publicKey
        };

        console.log("=== FORMATTED RPC CALL ===");
        console.log(JSON.stringify(rpcCall, null, 2));
        console.log("=== NODE_URL ===");
        console.log(process.env.NODE_URL);

        // Make the actual RPC call to node1
        const response = await axios.post(process.env.NODE_URL, rpcCall, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        console.log("=== NODE1 RESPONSE ===");
        console.log(response.data);

        res.json(response.data);
    } catch (error) {
        console.error("=== ERROR ===");
        console.error("Error details:", error);
        res.status(500).json({ error: "Failed to perform player action", details: error.message });
    }
});

// ===================================
// 13. Account-related endpoints
// ===================================
app.get("/account/:id", async (req, res) => {
    console.log("\n=== Account Request ===");
    console.log("Address:", req.params.id);

    try {
        const client = new NodeRpcClient(process.env.NODE_URL || "http://localhost:3000", process.env.VALIDATOR_KEY || "");
        const account = await client.getAccount(req.params.id);

        res.json({
            nonce: account.nonce || 0,
            address: account.address,
            balance: account.balance.toString()
        });
    } catch (error) {
        console.error("SDK Error:", error);
        res.json({
            nonce: 0,
            address: req.params.id,
            balance: "0",
            error: "Failed to fetch account"
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
    console.log("\n=== Nonce Request ===");
    console.log("Address:", req.params.address);

    try {
        const client = getClient();
        const account = await client.getAccount(req.params.address);

        // Clean response with no duplicates
        const response = {
            result: {
                data: {
                    address: req.params.address,
                    balance: account.balance?.toString() || "0",
                    nonce: account.nonce || 0
                },
                signature: account.signature
            },
            timestamp: getUnixTime()
        };

        console.log("Clean nonce response:", response);
        res.json(response);
    } catch (error) {
        console.error("Error getting nonce:", error);
        res.status(500).json({
            error: "Failed to get nonce",
            details: error.message
        });
    }
});

// Add a test endpoint to check WebSocket functionality
app.get("/websocket-test", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WebSocket Test</title>
    </head>
    <body>
      <h1>WebSocket Test</h1>
      <div id="status">Connecting...</div>
      <div id="messages"></div>
      <script>
        const status = document.getElementById('status');
        const messages = document.getElementById('messages');
        
        // Create WebSocket connection
        const socket = new WebSocket('${req.protocol === "https" ? "wss" : "ws"}://${req.headers.host}/ws');
        
        // Connection opened
        socket.addEventListener('open', (event) => {
          status.textContent = 'Connected';
          socket.send(JSON.stringify({type: 'ping'}));
        });
        
        // Listen for messages
        socket.addEventListener('message', (event) => {
          const msg = document.createElement('div');
          msg.textContent = 'Received: ' + event.data;
          messages.appendChild(msg);
        });
        
        // Connection closed
        socket.addEventListener('close', (event) => {
          status.textContent = 'Disconnected: ' + event.code;
        });
        
        // Connection error
        socket.addEventListener('error', (event) => {
          status.textContent = 'Error';
          console.error('WebSocket error:', event);
        });
      </script>
    </body>
    </html>
  `);
});

// ===================================
// Deal cards endpoint
// ===================================
app.post("/table/:tableId/deal", async (req, res) => {
    console.log("=== DEAL CARDS REQUEST ===");
    console.log("Request body:", req.body);
    console.log("Route params:", req.params);

    try {
        // Format the RPC call to match the SDK client structure
        const rpcCall = {
            id: "1",
            version: "2.0",
            method: "deal",
            params: [
                req.params.tableId,                // table address
                req.body.seed || "randomseed123",  // random seed (use provided or default) todo: this should be the seed from the game
                req.body.publicKey                 // public key
            ],
            signature: req.body.signature
        };

        console.log("=== FORMATTED RPC CALL ===");
        console.log(JSON.stringify(rpcCall, null, 2));
        console.log("=== NODE_URL ===");
        console.log(process.env.NODE_URL);

        // Make the actual RPC call to node1
        const response = await axios.post(process.env.NODE_URL, rpcCall, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        console.log("=== NODE1 RESPONSE ===");
        console.log(response.data);

        res.json(response.data);
        
        // Also broadcast this update to WebSocket clients
        if (tableSubscriptions.has(req.params.tableId)) {
            console.log(`Broadcasting table update after deal to ${tableSubscriptions.get(req.params.tableId).size} WebSocket clients`);
            await broadcastTableUpdate(req.params.tableId);
        }
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
    console.log("Table ID:", req.params.tableId);

    try {
        // Format the RPC call according to the specified structure
        const rpcCall = {
            id: "1",
            method: "get_game_state",
            version: "2.0",
            params: [req.params.tableId]
        };

        console.log("=== FORMATTED RPC CALL ===");
        console.log(JSON.stringify(rpcCall, null, 2));
        console.log("=== NODE_URL ===");
        console.log(process.env.NODE_URL);

        // Make the actual RPC call to the node
        const response = await axios.post(process.env.NODE_URL || "https://node1.block52.xyz", rpcCall, {
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
            error: "Failed to get game state", 
            details: error.message 
        });
    }
});

// ===================================
// 14. Start Server
// ===================================
server.listen(port, "0.0.0.0", () => {
    console.log(`
    ====================================
    🚀 Server is running
    📡 Port: ${port}
    🔑 Client: ${clientType}
    🌍 URL: http://localhost:${port}
    📚 Docs: http://localhost:${port}/docs
    ====================================
    `);
});

// ===================================
// 15. Handle Process Events
// ===================================
process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
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
