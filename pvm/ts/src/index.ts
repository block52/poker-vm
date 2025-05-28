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

// WebSocket test page
app.get("/ws-test", (req: Request, res: Response) => {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Test - PVM</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .form-group { margin: 10px 0; }
        label { display: inline-block; width: 150px; }
        input, button { padding: 5px; margin: 5px; }
        #messages { border: 1px solid #ccc; height: 300px; overflow-y: scroll; padding: 10px; margin: 10px 0; }
        .message { margin: 5px 0; padding: 5px; background: #f5f5f5; }
        .sent { background: #e3f2fd; }
        .received { background: #f3e5f5; }
        .error { background: #ffebee; color: red; }
        .success { background: #e8f5e8; color: green; }
    </style>
</head>
<body>
    <div class="container">
        <h1>PVM WebSocket Test</h1>
        
        <div class="form-group">
            <label>WebSocket URL:</label>
            <input type="text" id="wsUrl" value="ws://localhost:3000" style="width: 300px;">
        </div>
        
        <div class="form-group">
            <label>Table Address:</label>
            <input type="text" id="tableAddress" value="0x1234567890123456789012345678901234567890" style="width: 300px;">
        </div>
        
        <div class="form-group">
            <label>Player ID:</label>
            <input type="text" id="playerId" value="0xPlayerAddress123" style="width: 300px;">
        </div>
        
        <div class="form-group">
            <button onclick="connectWithParams()">Connect with URL Params</button>
            <button onclick="connectBasic()">Connect Basic</button>
            <button onclick="disconnect()">Disconnect</button>
        </div>
        
        <div class="form-group">
            <button onclick="subscribe()">Subscribe</button>
            <button onclick="unsubscribe()">Unsubscribe</button>
        </div>
        
        <div class="form-group">
            <label>Custom Message:</label>
            <input type="text" id="customMessage" value='{"action": "subscribe", "tableAddress": "0x123", "playerId": "0xPlayer"}' style="width: 400px;">
            <button onclick="sendCustomMessage()">Send</button>
        </div>
        
        <div id="status">Disconnected</div>
        <div id="messages"></div>
    </div>

    <script>
        let ws = null;
        
        function log(message, type = 'message') {
            const messages = document.getElementById('messages');
            const div = document.createElement('div');
            div.className = 'message ' + type;
            div.innerHTML = new Date().toLocaleTimeString() + ': ' + message;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }
        
        function updateStatus(status) {
            document.getElementById('status').textContent = 'Status: ' + status;
        }
        
        function connectWithParams() {
            const baseUrl = document.getElementById('wsUrl').value;
            const tableAddress = document.getElementById('tableAddress').value;
            const playerId = document.getElementById('playerId').value;
            const url = baseUrl + '?tableAddress=' + encodeURIComponent(tableAddress) + '&playerId=' + encodeURIComponent(playerId);
            connect(url);
        }
        
        function connectBasic() {
            const url = document.getElementById('wsUrl').value;
            connect(url);
        }
        
        function connect(url) {
            if (ws) {
                ws.close();
            }
            
            log('Connecting to: ' + url, 'sent');
            updateStatus('Connecting...');
            
            ws = new WebSocket(url);
            
            ws.onopen = function() {
                log('Connected successfully!', 'success');
                updateStatus('Connected');
            };
            
            ws.onmessage = function(event) {
                log('Received: ' + event.data, 'received');
            };
            
            ws.onclose = function() {
                log('Connection closed', 'error');
                updateStatus('Disconnected');
            };
            
            ws.onerror = function(error) {
                log('Error: ' + error, 'error');
                updateStatus('Error');
            };
        }
        
        function disconnect() {
            if (ws) {
                ws.close();
                ws = null;
            }
        }
        
        function subscribe() {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                log('Not connected!', 'error');
                return;
            }
            
            const message = {
                action: 'subscribe',
                tableAddress: document.getElementById('tableAddress').value,
                playerId: document.getElementById('playerId').value
            };
            
            ws.send(JSON.stringify(message));
            log('Sent: ' + JSON.stringify(message), 'sent');
        }
        
        function unsubscribe() {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                log('Not connected!', 'error');
                return;
            }
            
            const message = {
                action: 'unsubscribe',
                tableAddress: document.getElementById('tableAddress').value,
                playerId: document.getElementById('playerId').value
            };
            
            ws.send(JSON.stringify(message));
            log('Sent: ' + JSON.stringify(message), 'sent');
        }
        
        function sendCustomMessage() {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                log('Not connected!', 'error');
                return;
            }
            
            const message = document.getElementById('customMessage').value;
            ws.send(message);
            log('Sent: ' + message, 'sent');
        }
    </script>
</body>
</html>`;
    res.send(html);
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
