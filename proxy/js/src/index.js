const express = require("express");
const ethers = require("ethers");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
const app = express();

// Add JSON middleware
app.use(express.json());

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

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("/account/:id", (req, res) => {
    const response = {
        id: req.params.id,
        balance: ethers.parseEther("1.0")
    };
    res.send(response);
});

app.get("/games", (req, res) => {
    const id1 = ethers.ZeroAddress;
    const id2 = ethers.ZeroAddress;

    const min = 50; // ethers.utils.parseEther("50");
    const max = 200; //ethers.utils.parseEther("200");

    const response = [
        { id: id1, type: "No Limit Texas Holdem", max_players: 9, min, max },
        { id: id2, type: "No Limit Texas Holdem", max_players: 6, min, max }
    ];

    res.send(response);
});

app.get("/tables", (req, res) => {
    const id1 = ethers.ZeroAddress;
    const id2 = ethers.ZeroAddress;

    const min = 50; // ethers.utils.parseEther("50");
    const max = 200; //ethers.utils.parseEther("200");

    const response = [
        { id: id1, type: "No Limit Texas Holdem", max_players: 9, min, max, bb: 1, sb: 0.5 },
        { id: id2, type: "No Limit Texas Holdem", max_players: 6, min, max, bb: 2, sb: 1 }
    ];

    res.send(response);
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

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
