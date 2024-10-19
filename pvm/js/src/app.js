import express from "express";
const PORT = process.env.PORT || 3000;

const app = express();

import http from "http";
const server = http.createServer(app);
const { Server } = require("socket.io");

// const cors = require("cors");
// const mongoose = require("mongoose");
// const rpc = require("./rpc");
import cors from "cors";
import mongoose from "mongoose";
import router from "./routes/index.mjs";

// const io = new Server(server);

const version = "1.0.0";

const connectDB = require("./config/dbConfig.mjs");
connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ version });
});

app.use("/", router);

mongoose.connection.once("open", () => {
  app.listen(PORT, async () => {
    console.log(`PVM server running on port ${PORT}`);
  });
});

export default app;
