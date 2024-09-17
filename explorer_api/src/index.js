const express = require("express");
const app = express();
const mongoose = require("mongoose");

const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 3000;

// Hello World GET route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/block/:id", async (req, res) => {
  res.send(response.data);
});

app.get("/blocks", (req, res) => {
  res.send("Blocks route");
});

// Start the server
mongoose.connection.once("open", () => {
  app.listen(PORT, async () => {
    console.log(`PVM server running on port ${PORT}`);
  });
});
