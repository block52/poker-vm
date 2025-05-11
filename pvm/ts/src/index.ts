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

// Simple HTML test page for WebSocket
app.get("/ws-test", (req: Request, res: Response) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>WebSocket Test</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            #status { font-weight: bold; }
            #updates { margin-top: 20px; border: 1px solid #ccc; padding: 10px; height: 300px; overflow: auto; }
            pre { margin: 0; }
            .message { margin-bottom: 10px; padding: 5px; border-bottom: 1px solid #eee; }
            input[type="text"] { width: 400px; padding: 5px; }
            button { padding: 5px 10px; margin-left: 5px; }
        </style>
    </head>
    <body>
        <h1>WebSocket Test</h1>
        <div>
            <p>Status: <span id="status">Disconnected</span></p>
            <input id="address" type="text" placeholder="Table Address (ETH address)" value="0x1234567890123456789012345678901234567890">
            <button onclick="connect()">Connect</button>
            <button onclick="subscribe()">Subscribe</button>
            <button onclick="unsubscribe()">Unsubscribe</button>
            <button onclick="disconnect()">Disconnect</button>
        </div>
        <h2>Messages:</h2>
        <div id="updates"></div>
        
        <script>
            let socket = null;
            const statusEl = document.getElementById('status');
            const updatesEl = document.getElementById('updates');
            
            function connect() {
                const tableAddress = document.getElementById('address').value;
                const wsUrl = 'ws://' + window.location.host + '/?tableAddress=' + tableAddress;
                
                statusEl.textContent = 'Connecting...';
                
                socket = new WebSocket(wsUrl);
                
                socket.onopen = () => {
                    statusEl.textContent = 'Connected';
                    addMessage('Connected to WebSocket server');
                };
                
                socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        addMessage('Received: ' + JSON.stringify(data, null, 2));
                        
                        if (data.type === 'subscribed') {
                            statusEl.textContent = 'Subscribed to ' + data.tableAddress;
                        } else if (data.type === 'unsubscribed') {
                            statusEl.textContent = 'Unsubscribed from ' + data.tableAddress;
                        } else if (data.type === 'gameStateUpdate') {
                            // Highlight game state updates
                            const el = addMessage('Game State Update for ' + data.tableAddress + ':\\n' + 
                                JSON.stringify(data.gameState, null, 2));
                            el.style.backgroundColor = '#e6f7ff';
                        }
                    } catch (err) {
                        addMessage('Error parsing message: ' + err.message);
                    }
                };
                
                socket.onclose = () => {
                    statusEl.textContent = 'Disconnected';
                    addMessage('Disconnected from WebSocket server');
                    socket = null;
                };
                
                socket.onerror = (error) => {
                    statusEl.textContent = 'Error';
                    addMessage('WebSocket error: ' + error);
                };
            }
            
            function disconnect() {
                if (socket) {
                    socket.close();
                    socket = null;
                    statusEl.textContent = 'Disconnected';
                }
            }
            
            function subscribe() {
                if (!socket) {
                    alert('Please connect first');
                    return;
                }
                
                const tableAddress = document.getElementById('address').value;
                const message = {
                    action: 'subscribe',
                    tableAddress: tableAddress
                };
                
                socket.send(JSON.stringify(message));
                addMessage('Sent subscribe request for ' + tableAddress);
            }
            
            function unsubscribe() {
                if (!socket) {
                    alert('Please connect first');
                    return;
                }
                
                const tableAddress = document.getElementById('address').value;
                const message = {
                    action: 'unsubscribe',
                    tableAddress: tableAddress
                };
                
                socket.send(JSON.stringify(message));
                addMessage('Sent unsubscribe request for ' + tableAddress);
            }
            
            function addMessage(text) {
                const div = document.createElement('div');
                div.className = 'message';
                div.textContent = text;
                updatesEl.appendChild(div);
                updatesEl.scrollTop = updatesEl.scrollHeight;
                return div;
            }
        </script>
    </body>
    </html>
    `);
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
