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
const Transaction = require("./models/transaction");
const axios = require("axios");
const depositSessionsRouter = require("./routes/depositSessions");
const swaggerSetup = require("./swagger/setup");
const Block52 = require("./clients/block52");

const { getUnixTime } = require("./utils/helpers");


// ===================================
// 2. Load Environment Configuration
// ===================================
dotenv.config();
const clientType = process.env.CLIENT_TYPE || "block52";
const port = process.env.PORT || 8080;


// ===================================
// 3. Initialize Client (Singleton)
// ===================================
let clientInstance = null;
const getClient = () => {
    if (clientInstance) {
        return clientInstance;
    }

    if (clientType === "mock") {
        console.log("Using mock client");
        const seed = process.env.SEED;
        clientInstance = new Mocks(seed);
    } else if (clientType === "block52") {
        const node_url = process.env.NODE_URL || "https://node1.block52.xyz/";
        console.log("Using Block52 client with node URL:", node_url);
        clientInstance = new Block52(node_url);
    } else {
        throw new Error("Client type not found");
    }

    return clientInstance;
};

// Initialize the client once at startup
getClient();

// Add this debug log
console.log(`Configured client: ${clientType}, NODE_URL: ${process.env.NODE_URL || 'using default'}`);


// ===================================
// 4. Initialize Express Application
// ===================================
const app = express();


// ===================================
// 5. Configure Middleware
// ===================================
// Enable CORS for all routes
app.use(cors());
// Parse JSON bodies
app.use(express.json());


// ===================================
// 6. Database Connection
// ===================================
connectDB().then(() => {
    console.log("MongoDB connection established");
}).catch(err => {
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
// 9. Game lobby-related endpoints
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
// 10. Table-related endpoints
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


app.get("/table/:id", async (req, res) => {
    console.log('=== TABLE REQUEST ===');
    console.log('Route params:', req.params);

    const id = req.params.id;
    console.log(`Fetching table with ID: ${id}`);

    try {
        const client = getClient();
        const table = await client.getTable(id);

        console.log('=== TABLE RESPONSE FROM NODE1 ===');
        console.log(JSON.stringify(table, null, 2));

        res.send(table);
    } catch (error) {
        console.error('=== TABLE ERROR ===');
        console.error('Error details:', error);
        res.status(500).json({
            error: "Failed to fetch table",
            details: error.message
        });
    }
});


// ===================================
// 11. Join table endpoint
// ===================================
app.post("/table/:tableId/join", async (req, res) => {
    console.log('=== JOIN TABLE REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Route params:', req.params);

    const { address, buyInAmount, seat, signature, publicKey } = req.body;
    const { tableId } = req.params;

    try {
        // Format the RPC call structure
        const rpcCall = {
            id: "1",
            version: "2.0",
            method: "transfer",
            params: [
                address,        // Player's address
                tableId,        // Table address
                buyInAmount,    // Buy in amount
                "join",
            ],
            signature,
            publicKey
            // todo: add "signature" of rpc call to be processeed by the node 

        };

        console.log('=== FORMATTED RPC CALL ===');
        console.log(JSON.stringify(rpcCall, null, 2));

        // Make the actual RPC call to node1
        const response = await axios.post('https://node1.block52.xyz', rpcCall, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('=== NODE1 RESPONSE ===');
        console.log(response.data);

        res.json(response.data);
    } catch (error) {
        console.error('=== ERROR ===');
        console.error('Error details:', error);
        res.status(500).json({ error: "Failed to join table", details: error.message });
    }
});


// ===================================
// 11. Account-related endpoints
// ===================================
app.get("/account/:id", async (req, res) => {
    console.log('\n=== Account Request ===');
    console.log('Address:', req.params.id);

    try {
        const client = getClient();
        const account = await client.getAccount(req.params.id);

        // If there was a node error, still return a 200 with fallback data
        if (account.isNodeError) {
            console.warn('Node error when fetching account:', account.error);
            return res.json({
                nonce: 0,
                address: req.params.id,
                balance: "0",
                error: account.error
            });
        }

        // Normal successful response
        res.json({
            nonce: account.nonce || 0,
            address: account.address,
            balance: account.balance.toString()
        });

    } catch (error) {
        console.error('Unexpected error in route handler:', error);
        // Return fallback data instead of error status
        res.json({
            nonce: 0,
            address: req.params.id,
            balance: "0",
            error: "Internal server error"
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

app.get("/nonce", (req, res) => {
    const response = {
        nonce: getUnixTime()
    };

    res.send(response);
});





// ===================================
// 9. Start Server
// ===================================
app.listen(port, () => {
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
// 10. Handle Process Events
// ===================================
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    // Perform cleanup here
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Perform cleanup here
    process.exit(1);
});