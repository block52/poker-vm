const BigUnit = require("bigunit");
const express = require("express");
const cors = require("cors");
const ethers = require("ethers");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
const dotenv = require("dotenv");

// Clients
// const { Mocks, Block52 } = require("./clients/index");
const Mocks = require("./clients/mocks");
const Block52 = require("./clients/block52");

const app = express();
// use cors
app.use(cors());

// Load environment variables
dotenv.config();
const clientType = process.env.CLIENT_TYPE || "mock";

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
    if (clientType === "mock") {
        console.log("Using mock client");
        const seed = process.env.SEED;
        return new Mocks(seed);
    }

    if (clientType === "block52") {
        console.log("Using Block52 client");
        const node_url = process.env.NODE_URL || "https://node1.block52.xyz/";
        return new Block52(node_url);
    }

    throw new Error("Client type not found");
}

// Routes
app.get("/account/:id", async (req, res) => {
    const client = getClient();
    const account = await client.getAccount(req.params.id);

    // const balance = ethers.formatUnits(account.balance.toString());

    const response = {
        index: req.params.id,
        address: account.address,
        privateKey: account.privateKey,
        path: account.path,
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

    const min = BigUnit.from("0.01").toString();
    const max = BigUnit.from("1").toString();

    const response = [
        { id: id1, type: "No Limit Texas Holdem", variant: "No Limit", max_players: 9, min, max },
        { id: id2, type: "No Limit Texas Holdem", variant: "No Limit", max_players: 6, min, max }
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
        balance: ethers.utils.formatEther(req.body.balance)
    };
    res.send(response);
});

// Deposit to the layer 2
app.post("/deposit", (req, res) => {
    const signature = req.body?.signature;
    if (!signature) {
        res.status(400).send("Signature required");
        return;
    }

    const nonce = req.body?.nonce;
    if (!nonce) {
        res.status(400).send("Nonce required");
        return;
    }

    const txId = req.body?.txId;
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

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
