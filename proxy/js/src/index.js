const express = require("express");
const ethers = require("ethers");
const app = express();

// Add JSON middleware
app.use(express.json());

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

    const response = [
        { id: id1, type: "No Limit Texas Holdem" },
        { id: id2, type: "No Limit Texas Holdem" }
    ];
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
