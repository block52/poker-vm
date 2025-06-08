import http from "http";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { RPC } from "./rpc";
import { getServerInstance } from "./core/server";
import cors from "cors";
import { initSocketServer } from "./core/socketserver";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // Add this line to enable CORS for all routes
const PORT = process.env.PORT || 3000;

const version = "0.1.1";

// Initialize Socket.IO server
// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const socketService = initSocketServer(server);

// Define a simple route
app.get("/", (req: Request, res: Response) => {
    res.send(`PVM RPC Server v${version}`);
});

// WebSocket status endpoint
app.get("/socket-status", (req: Request, res: Response) => {
    res.json({
        websocket_server: "active",
        subscriptions: socketService.getSubscriptionInfo()
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
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`WebSocket server is running on ws://localhost:${PORT}`);
    console.log(`WebSocket test page available at http://localhost:${PORT}/ws-test`);

    // Get args from command line
    const args = process.argv.slice(2);
    getServerInstance().bootstrap(args);
});
