const express = require("express");
const app = express();
const axios = require("axios");

const dotenv = require("dotenv");
dotenv.config();

const node_url = process.env.NODE_ENV || "http://localhost:3000";
const port = process.env.PORT || 3000;

// Hello World GET route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/block/:id", async (req, res) => {
  const data = JSON.stringify({
    method: "get_block",
    params: [0],
    id: 1,
    jsonrpc: "2.0",
    data: "",
  });

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: node_url,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  const response = await axios.request(config);
  res.send(response.data);
});

app.get("/blocks", (req, res) => {
  res.send("Blocks route");
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
