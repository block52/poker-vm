import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { RPC } from "./rpc";
import { getInstance } from "./core/server";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // Add this line to enable CORS for all routes
const PORT = process.env.PORT || 3001;

const version = "0.1.0";

// Define a simple route
app.get("/", (req: Request, res: Response) => {
  res.send(`PVM RPC Server v${version}`);
});

app.post("/", async (req: Request, res: Response) => {
  const body = req.body;

  if (!body) {
    res.status(400).json({ error: "Invalid request" });
  }

  const response = await RPC.handle(body)
  res.json(response);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  getInstance().bootstrap();
});

// listenToOracle();
