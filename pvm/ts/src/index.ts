import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { RPC } from "./rpc";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Define a simple route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});

app.post("/", async (req: Request, res: Response) => {
  const response = await RPC.handle(req.body)
  res.json(response);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
