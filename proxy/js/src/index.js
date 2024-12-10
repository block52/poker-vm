const express = require("express");
const ethers = require("ethers");
const crypto = require("crypto");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
const dotenv = require("dotenv");

// Clients
const Mocks = require("./clients/mocks");
const app = express();

// Load environment variables
dotenv.config();
const proxy = process.env.PROXY || "mock";

// Add JSON middleware
app.use(express.json());

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
}

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const getClient = () => {
    if (proxy === "mock") {
        return new Mocks();
    }

    throw new Error("Client not found");
}

// Routes
app.get("/account/:id", async (req, res) => {
    const client = getClient();
    const account = client.getAccount(req.params.id);

    const response = {
        index: req.params.id,
        address: account.address,
        privateKey: account.privateKey,
        path: account.path,
        balance: account.balance
    };

    res.send(response);
    return;
});

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

    const min = "50.00"; // ethers.utils.parseEther("50");
    const max = "200.00"; //ethers.utils.parseEther("200");

    const response = [
        { id: id1, type: "No Limit Texas Holdem", max_players: 9, min, max },
        { id: id2, type: "No Limit Texas Holdem", max_players: 6, min, max }
    ];

    res.send(response);
});

app.get("/tables", (req, res) => {
    const id1 = ethers.ZeroAddress;
    const id2 = ethers.ZeroAddress;

    const min = ethers.utils.parseEther("50");
    const max = ethers.utils.parseEther("200");

    const response = [
        { id: id1, type: "No Limit Texas Holdem", max_players: 9, min: min.toString(), max: max.toString(), bb: 1, sb: "0.50" },
        { id: id2, type: "No Limit Texas Holdem", max_players: 6, min: min.toString(), max: max.toString(), bb: 2, sb: "1.00" }
    ];

    res.send(response);
});

app.get("/table/:id", async (req, res) => {
    const id = req.params.id;

    const client = getClient();
    const table = await client.getTable(id);

    res.send(table);
});

app.get("/table/:id/player/:player", (req, res) => {
    const client = getClient();
    const id = req.params.id;
    const playerId = req.params.player;
    const player = client.getPlayer(id, player);

    res.send(response);
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
});

app.post("/join", (req, res) => {
    const response = {
        id: 1,
        balance: ethers.utils.formatEther(req.body.balance)
    };
    res.send(response);
});

// Deposit to the layer 2
app.post("/deposit", (req, res) => {
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

    const txId = req.body.txId;
    if (!txId) {
        res.status(400).send("Transaction ID required");
        return;
    }

    const response = {
        id: 1,
        balance: ethers.utils.formatEther(req.body.balance),
        tx: ethers.ZeroHash
    };

    res.send(response);
});

app.post("/transfer", (req, res) => {
    const response = {
        id: 1,
        balance: ethers.utils.formatEther(req.body.balance)
    };
    res.send(response);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
