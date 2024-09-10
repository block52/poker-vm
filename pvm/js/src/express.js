const express = require("express");
const PORT = process.env.PORT || 3000;

const app = express();

const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

const cors = require("cors");
const mongoose = require("mongoose");
const rpc = require("./rpc");
// const io = new Server(server);

const version = "1.0.0";

const connectDB = require("./config/dbConfig");
connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ version });
});

app.use("/", rpc);

mongoose.connection.once("open", () => {
  app.listen(PORT, async () => {
    console.log(`PVM server running on port ${PORT}`);
  });
});
