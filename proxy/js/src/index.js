const { BigUnit } = require("bigunit");
const express = require("express");
const cors = require("cors");
const ethers = require("ethers");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
const dotenv = require("dotenv");
const connectDB = require("./db");
const Transaction = require("./models/transaction");
const axios = require("axios");
const depositSessionsRouter = require("./routes/depositSessions");

// Clients

const Block52 = require("./clients/block52");

const app = express();
// use cors
app.use(cors());

// Load environment variables
dotenv.config();
const clientType = process.env.CLIENT_TYPE || "block52";

// Add this debug log
console.log(`Configured client: ${clientType}, NODE_URL: ${process.env.NODE_URL || 'using default'}`);

// Add JSON middleware
app.use(express.json());


connectDB().then(() => {
    console.log("MongoDB connection established");
}).catch(err => {
    console.error("MongoDB connection error:", err);
});


// Routes
app.use("/deposit-sessions", depositSessionsRouter);

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Block 52 Proxy API Documentation",
            version: "1.0.1",
            description: "Proxy calls to the RPC layer 2"
        },
        servers: [
            {
                url: "https://proxy.block52.xyz",
                description: "Mainnet server"
            }
        ]
    },
    // Path to the API docs
    apis: ["./*.js"] // Path to your API route files
};

// Initialize swagger-jsdoc
const swaggerDocs = swaggerJSDoc(swaggerOptions);

const getUnixTime = () => {
    return Math.floor(Date.now() / 1000);
};

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const getClient = () => {
    if (clientType === "mock") {
        console.log("Using mock client");
        const seed = process.env.SEED;
        return new Mocks(seed);
    }

    if (clientType === "block52") {
        const node_url = process.env.NODE_URL || "https://node1.block52.xyz/";
        console.log("Using Block52 client with node URL:", node_url);
        return new Block52(node_url);
    }

    throw new Error("Client type not found");
};

// Routes
app.get("/account/:id", async (req, res) => {
    const client = getClient();
    const account = await client.getAccount(req.params.id);

    // const balance = ethers.formatUnits(account.balance.toString());

    const response = {
        nonce: 0,
        address: account.address,
        balance: account.balance.toString()
    };

    res.send(response);
    return;
});

// app.get("/account/balance", async (req, res) => {
//     const client = getClient();
//     const account = client.getAccount(req.query.id);
//     res.send(account.balance);
//     return;
// });

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

app.get("/tables", async (req, res) => {
    const client = getClient();
    const table = await client.getTables();

    res.send(table);
});

app.get("/table/:id", async (req, res) => {
    const id = req.params.id;

    const client = getClient();
    const table = await client.getTable(id);

    res.send(table);
});

app.get("/table/:id/player/:seat", (req, res) => {
    const client = getClient();
    const id = req.params.id;
    const seat = req.params.seat;
    const player = client.getPlayer(id, seat);

    res.send(player);
});

app.post("/table/:id", (req, res) => {
    const signature = req.body.signature;
    if (!signature) {
        res.status(400).send("Signature required");
        return;
    }

    const nonce = req.body?.nonce;
    if (!nonce) {
        res.status(400).send("Nonce required");
        return;
    }

    const client = getClient();
});

app.post("/join", (req, res) => {
    const response = {
        id: 1,
        balance: ethers.utils.formatEther(req.body.balance),
        version: "2.0",
        method: "transfer",
        params: [
            req.body.recipient,
            req.body.amount
        ]
    };
    res.send(response);
});

app.post("/table/:tableId/join", async (req, res) => {
    console.log('=== JOIN TABLE REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Route params:', req.params);

    const { address, buyInAmount, seat } = req.body;
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
                "join"
            ]
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

app.post("/deposit", async (req, res) => {
    const recipient = req.body.recipient;


    // Create a new transaction
    const newTransaction = new Transaction({
        address: "0x123...",
        amount: 1.5
        // timestamp will be set automatically
    });

    // Save to database
    await newTransaction.save();

    const response = {
        index,
        address
    };

    res.send(response);
});

app.put("/deposit/:id", async (req, res) => {
    // get erc20 balance abi
    const erc20Abi = ["function balanceOf(address owner) view returns (uint256)"];

    const usdcAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    const provider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL);
    const contract = new ethers.Contract(usdcAddress, erc20Abi, provider);

    const balance = await contract.balanceOf(req.params.id);
    const response = {
        id: 1,
        balance: ethers.utils.formatUnits(balance.toString(), 6)
    };

    const transaction = await Transaction.findById(req.params.id);

    res.send(response);
});


app.post("/transfer", (req, res) => {
    const response = {
        id: 1,
        balance: ethers.utils.formatEther(req.body.balance)
    };
    res.send(response);
});



const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
