import { Server as HttpServer } from "http";
import WebSocket from "ws";
import { TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import url from "url";

// Map of table addresses to set of WebSocket connections
const tableSubscriptions: Map<string, Set<WebSocket>> = new Map();

// Type definitions for message formats
type SubscribeMessage = {
    action: "subscribe";
    tableAddress: string;
    playerId: string;
};

type UnsubscribeMessage = {
    action: "unsubscribe";
    tableAddress: string;
    playerId: string;
};

type ClientMessage = SubscribeMessage | UnsubscribeMessage;

type GameStateUpdateMessage = {
    type: "gameStateUpdate";
    tableAddress: string;
    gameState: TexasHoldemStateDTO;
};

export class SocketService {
    private readonly wss: WebSocket.Server;
    private readonly maxConnections: number;
    private activeConnections: number = 0;

    constructor(server: HttpServer, maxConnections: number = 100) {
        this.wss = new WebSocket.Server({ server });
        this.maxConnections = maxConnections;
        this.setupSocketEvents();
        console.log("WebSocket server initialized");
    }

    private setupSocketEvents() {
        console.log("Setting up WebSocket events");

        this.wss.on("connection", (ws: WebSocket, req: any) => {
            // Check if we've reached the connection limit
            if (this.activeConnections >= this.maxConnections) {
                console.log(`Connection limit reached (${this.maxConnections}). Rejecting new connection.`);
                ws.close(1013, "Maximum number of connections reached"); // 1013 = "Try again later"
                return;
            }

            this.activeConnections++;
            console.log(`WebSocket connected from ${req.socket.remoteAddress}`);

            // Try to get tableAddress from URL query parameters
            const parsedUrl = url.parse(req.url || "", true);
            const tableAddress = parsedUrl.query.tableAddress as string;
            const playerId = parsedUrl.query.playerId as string;

            // If tableAddress is provided in URL, auto-subscribe
            if (tableAddress) {
                this.subscribeToTable(tableAddress, playerId, ws);
                console.log(`Auto-subscribed to table ${tableAddress}`);

                // Send confirmation message
                this.sendMessage(ws, {
                    type: "subscribed",
                    tableAddress,
                    playerId
                });
            }

            // Handle messages from client
            ws.on("message", (message: string) => {
                try {
                    const data = JSON.parse(message) as ClientMessage;

                    if (data.action === "subscribe" && data.tableAddress && data.playerId) {
                        this.subscribeToTable(data.tableAddress, data.playerId, ws);
                        console.log(`Subscribed to table ${data.tableAddress}`);

                        // Send confirmation
                        this.sendMessage(ws, {
                            type: "subscribed",
                            tableAddress: data.tableAddress
                        });
                    } else if (data.action === "unsubscribe" && data.tableAddress) {
                        this.unsubscribeFromTable(data.tableAddress, ws);
                        console.log(`Unsubscribed from table ${data.tableAddress}`);

                        // Send confirmation
                        this.sendMessage(ws, {
                            type: "unsubscribed",
                            tableAddress: data.tableAddress,
                            playerId: data.playerId
                        });
                    } else {
                        console.log(`Received unknown message: ${message}`);
                    }
                } catch (error) {
                    console.error("Error handling message:", error);
                    this.sendMessage(ws, {
                        type: "error",
                        message: "Invalid message format"
                    });
                }
            });

            // Handle disconnection
            ws.on("close", () => {
                this.activeConnections--;
                console.log("WebSocket disconnected");
                this.handleDisconnect(ws);
            });

            // Send welcome message
            this.sendMessage(ws, {
                type: "connected",
                message: "Connected to PVM WebSocket Server"
            });
        });
    }

    private sendMessage(ws: WebSocket, data: any) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }

    private subscribeToTable(tableAddress: string, playerId: string, ws: WebSocket) {
        // Get existing subscriptions or create new set
        if (!tableSubscriptions.has(tableAddress)) {
            tableSubscriptions.set(tableAddress, new Set());
        }

        // Add websocket to subscribers
        const subscribers = tableSubscriptions.get(tableAddress)!;
        subscribers.add(ws);
    }

    private unsubscribeFromTable(tableAddress: string, ws: WebSocket) {
        const subscribers = tableSubscriptions.get(tableAddress);

        if (subscribers) {
            subscribers.delete(ws);

            if (subscribers.size === 0) {
                // If no more subscribers, remove the table entry
                tableSubscriptions.delete(tableAddress);
            }
        }
    }

    private handleDisconnect(ws: WebSocket) {
        // Remove this websocket from all table subscriptions
        for (const [tableAddress, subscribers] of tableSubscriptions.entries()) {
            if (subscribers.has(ws)) {
                subscribers.delete(ws);

                if (subscribers.size === 0) {
                    // If no more subscribers, remove the table entry
                    tableSubscriptions.delete(tableAddress);
                }
            }
        }
    }

    // Method to broadcast game state updates (can be called from anywhere in the application)
    public broadcastGameStateUpdate(tableAddress: string, gameState: TexasHoldemStateDTO) {
        const subscribers = tableSubscriptions.get(tableAddress);

        if (subscribers && subscribers.size > 0) {
            console.log(`Broadcasting game state update for table ${tableAddress} to ${subscribers.size} subscribers`);

            const updateMessage: GameStateUpdateMessage = {
                type: "gameStateUpdate",
                tableAddress,
                gameState
            };

            const messageStr = JSON.stringify(updateMessage);

            // Send to all subscribed clients
            subscribers.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(messageStr);
                }
            });
        } else {
            console.log(`No subscribers for table ${tableAddress}, skipping broadcast`);
        }
    }

    // Get subscription information (for status endpoints)
    public getSubscriptionInfo() {
        const info: Record<string, number> = {};

        for (const [tableAddress, subscribers] of tableSubscriptions.entries()) {
            info[tableAddress] = subscribers.size;
        }

        return {
            tables: Object.keys(info).length,
            subscribers: info
        };
    }
}

let socketServiceInstance: SocketService | null = null;
export function initSocketServer(server: HttpServer): SocketService {
    if (!socketServiceInstance) {
        socketServiceInstance = new SocketService(server);
    }
    return socketServiceInstance;
}

export function getSocketService(): SocketService | null {
    return socketServiceInstance;
}
