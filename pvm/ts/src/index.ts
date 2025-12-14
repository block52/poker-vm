import http from "http";
import express, { Request, Response } from "express";
import { RPC } from "./rpc";
import cors from "cors";
import { readFileSync } from "fs";
import { join } from "path";

// Read version from package.json as single source of truth
const packageJson = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf-8"));
const VERSION = packageJson.version;

const app = express();
app.use(express.json());
app.use(cors()); // Add this line to enable CORS for all routes
const PORT = 8545;

// Initialize Socket.IO server
// Create HTTP server
const server = http.createServer(app);

// Define a simple route
app.get("/", (req: Request, res: Response) => {
    res.send(`PVM RPC Server v${VERSION}`);
});

// Health check endpoint for Docker
app.get("/health", (req: Request, res: Response) => {
    res.json({
        status: "healthy",
        version: VERSION,
        timestamp: new Date().toISOString(),
        service: "pvm-rpc-server"
    });
});

// Version endpoint for detailed version info
app.get("/version", (req: Request, res: Response) => {
    res.json({
        name: packageJson.name,
        version: VERSION,
        description: packageJson.description || "Poker Virtual Machine",
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
    });
});

app.post("/", async (req: Request, res: Response) => {
    const body = req.body;

    if (!body) {
        res.status(400).json({ error: "Invalid request" });
    }

    const response = await RPC.handle(body);
    res.json(response);
});

// Start the HTTP server (instead of app.listen)
server.listen(PORT, () => {
    console.log(`PVM RPC Server v${VERSION} running on http://localhost:${PORT}`);
});
