const express = require("express");
const ethers = require("ethers");
const crypto = require("crypto");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
const app = express();

// Add JSON middleware
app.use(express.json());

const account = require("./routes/account");

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Block 52 Proxy API Documentation",
            version: "1.0.0",
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

// Routes
// app.use("/account", () => account);
app.get("/account/:id", (req, res) => {
    const seed = process.env.SEED;
    const i = Number(req.params.id);

    const wallet = ethers.HDNodeWallet.fromPhrase(seed);
    const child = wallet.deriveChild(`${i}`);

    const response = {
        id: req.params.id,
        address: child.address,
        privateKey: child.privateKey,
        path: `m/44'/60'/0'/0/${i}`,
        balance: ethers.parseEther("1.0").toString()
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

    const min = "50.00"; // ethers.utils.parseEther("50");
    const max = "200.00"; //ethers.utils.parseEther("200");

    const response = [
        { id: id1, type: "No Limit Texas Holdem", max_players: 9, min, max, bb: 1, sb: "0.50" },
        { id: id2, type: "No Limit Texas Holdem", max_players: 6, min, max, bb: 2, sb: "1.00" }
    ];

    res.send(response);
});

app.get("/table/:id", (req, res) => {
    const id = req.params.id;
    const seed = process.env.SEED;
    const wallet = ethers.HDNodeWallet.fromPhrase(seed);

    const idHash = crypto.createHash("sha256").update(id).digest("hex");

    const response = {
        id: idHash,
        button: 1,
        playerCount: 9,
        players: [],
        pots: ["50.00", "10.00"],
        sb: "0.50",
        bb: "1.00",
        board: [],
        signature: ethers.ZeroHash
    };

    for (let i = 0; i < response.playerCount; i++) {
        // const stack = ethers.utils.parseEther("100.0").toString();
        const child = wallet.deriveChild(`${i}`);

        response.players.push({
            id: child.address,
            seat: i + 1,
            stack: "100.00",
            bet: "1.00",
            hand: [],
            status: "active",
            action: "check"
        });
    }

    res.send(response);
});

app.get("/table/:id/player/:player", (req, res) => {
    const response = {
        stack: "100.00",
        hand: [],
        status: "active",
        actions: ["check", "bet", "fold"],
        isTurn: true
    };

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
    const response = {
        id: 1,
        balance: ethers.utils.formatEther(req.body.balance)
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
