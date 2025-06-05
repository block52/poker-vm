import { Server as HttpServer } from "http";
import WebSocket from "ws";
import { TexasHoldemStateDTO, TransactionDTO } from "@bitcoinbrisbane/block52";
import url from "url";
import { verify } from "crypto";
import { verifySignature } from "../utils/crypto";
import { GameStateCommand, MempoolCommand } from "../commands";
import { ZeroAddress, ZeroHash } from "ethers";
import { getMempoolInstance } from "./mempool";

// Map of table addresses to map of player IDs to WebSocket connections
const tableSubscriptions: Map<string, Map<string, WebSocket>> = new Map();

// Set of WebSocket connections subscribed to mempool updates
const mempoolSubscriptions: Set<WebSocket> = new Set();

// Type definitions for message formats
type SubscribeMessage = {
    action: "subscribe";
    tableAddress: string;
    playerId: string;
    signature?: string; // Optional signature field
};

type UnsubscribeMessage = {
    action: "unsubscribe";
    tableAddress: string;
    playerId: string;
    signature?: string; // Optional signature field
};

type MempoolSubscribeMessage = {
    action: "subscribe_mempool";
};

type MempoolUnsubscribeMessage = {
    action: "unsubscribe_mempool";
};

type ClientMessage = SubscribeMessage | UnsubscribeMessage | MempoolSubscribeMessage | MempoolUnsubscribeMessage;

type GameStateUpdateMessage = {
    type: "gameStateUpdate";
    tableAddress: string;
    gameState: TexasHoldemStateDTO;
};

type MempoolUpdateMessage = {
    type: "mempoolUpdate";
    transactions: TransactionDTO[];
};

export interface SocketServiceInterface {
    getSubscribers(tableAddress: string): string[];
    sendGameStateToPlayer(tableAddress: string, playerId: string, gameState: TexasHoldemStateDTO): void;
    broadcastGameStateUpdate(tableAddress: string, playerId: string, gameState: TexasHoldemStateDTO): void;
    broadcastGameStateToAllSubscribers(tableAddress: string): Promise<void>;
    broadcastMempoolUpdate(): Promise<void>;
    getMempoolSubscriberCount(): number;
}

export class SocketService implements SocketServiceInterface {
    private readonly wss: WebSocket.Server;
    private readonly maxConnections: number;
    private activeConnections: number = 0;

    constructor(server: HttpServer, private readonly validatorPrivateKey: string, maxConnections: number = 100) {
        this.wss = new WebSocket.Server({ server });
        this.maxConnections = maxConnections;
        this.setupSocketEvents();
        console.log("WebSocket server initialized");
    }

    public getSubscribers(tableAddress: string): string[] {
        const playerMap = tableSubscriptions.get(tableAddress);
        if (!playerMap) return [];

        // Return array of player IDs subscribed to this table
        return Array.from(playerMap.keys());
    }

    public getMempoolSubscriberCount(): number {
        return mempoolSubscriptions.size;
    }

    private setupSocketEvents() {
        console.log("Setting up WebSocket events");

        this.wss.on("connection", async (ws: WebSocket, req: any) => {
            // Check if we've reached the connection limit
            if (this.activeConnections >= this.maxConnections) {
                console.log(`Connection limit reached (${this.maxConnections}). Rejecting new connection.`);
                ws.close(1013, "Maximum number of connections reached"); // 1013 = "Try again later"
                return;
            }

            try {
                this.activeConnections++;
                console.log(`WebSocket connected from ${req.socket.remoteAddress}`);

                // Try to get tableAddress and playerId from URL query parameters
                const parsedUrl = url.parse(req.url || "", true);
                const tableAddress = parsedUrl.query.tableAddress as string;
                const playerId = parsedUrl.query.playerId as string;
                const subscribeMempool = parsedUrl.query.subscribeMempool as string;

                // If tableAddress and playerId are provided in URL, auto-subscribe
                if (tableAddress && playerId) {
                    this.subscribeToTable(tableAddress, playerId, ws);
                    console.log(`Auto-subscribed player ${playerId} to table ${tableAddress}`);

                    // Get initial game state for this table
                    const gameStateCommand = new GameStateCommand(tableAddress, this.validatorPrivateKey, playerId);
                    const state = await gameStateCommand.execute();

                    // Send initial game state to the newly connected player
                    this.sendGameStateToPlayer(tableAddress, playerId, state.data);
                }

                // If subscribeMempool is provided in URL, auto-subscribe to mempool
                if (subscribeMempool === "true") {
                    this.subscribeToMempool(ws);
                    console.log("Auto-subscribed to mempool updates");

                    // Send initial mempool state
                    await this.sendMempoolToClient(ws);
                }
            } catch (error) {
                this.activeConnections--;
                console.error("Error during WebSocket connection setup:", error);
                ws.close(1011, "Internal server error"); // 1011 = "Unexpected condition"
                return;
            }

            // Handle messages from client
            ws.on("message", (message: WebSocket.Data) => {
                try {
                    // Convert Buffer to string if necessary
                    const messageStr = message instanceof Buffer ? message.toString("utf8") : message.toString();
                    const data = JSON.parse(messageStr) as ClientMessage;

                    if (data.action === "subscribe" && data.tableAddress && data.playerId) {
                        if (!verifySignature(data.playerId, data.signature || "", data.tableAddress)) {
                            console.log(`Signature verified for player ${data.playerId} on table ${data.tableAddress}`);
                            return;
                        }

                        this.subscribeToTable(data.tableAddress, data.playerId, ws);
                        console.log(`Subscribed player ${data.playerId} to table ${data.tableAddress}`);

                        // Send confirmation
                        this.sendMessage(ws, {
                            type: "subscribed",
                            tableAddress: data.tableAddress,
                            playerId: data.playerId
                        });
                    }

                    if (data.action === "unsubscribe" && data.tableAddress && data.playerId) {
                        this.unsubscribeFromTable(data.tableAddress, data.playerId);
                        console.log(`Unsubscribed player ${data.playerId} from table ${data.tableAddress}`);

                        // Send confirmation
                        this.sendMessage(ws, {
                            type: "unsubscribed",
                            tableAddress: data.tableAddress,
                            playerId: data.playerId
                        });
                    }

                    if (data.action === "subscribe_mempool") {
                        this.subscribeToMempool(ws);
                        console.log("Client subscribed to mempool updates");

                        // Send initial mempool state
                        this.sendMempoolToClient(ws);

                        // Send confirmation
                        this.sendMessage(ws, {
                            type: "mempool_subscribed"
                        });
                    }

                    if (data.action === "unsubscribe_mempool") {
                        this.unsubscribeFromMempool(ws);
                        console.log("Client unsubscribed from mempool updates");

                        // Send confirmation
                        this.sendMessage(ws, {
                            type: "mempool_unsubscribed"
                        });
                    }

                    if (!["subscribe", "unsubscribe", "subscribe_mempool", "unsubscribe_mempool"].includes(data.action)) {
                        console.log(`Received unknown message: ${messageStr}`);
                        this.sendMessage(ws, {
                            type: "error",
                            message: "Unknown message format or missing required fields"
                        });
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
            try {
                ws.send(JSON.stringify(data));
            } catch (error) {
                console.error("Error sending WebSocket message:", error);
            }
        }
    }

    private subscribeToTable(tableAddress: string, playerId: string, ws: WebSocket) {
        // Get or create the map of players for this table
        if (!tableSubscriptions.has(tableAddress)) {
            tableSubscriptions.set(tableAddress, new Map<string, WebSocket>());
        }

        // Add player's WebSocket to the table's player map
        const playerMap = tableSubscriptions.get(tableAddress)!;
        playerMap.set(playerId, ws);

        console.log(`Table ${tableAddress} now has ${playerMap.size} subscribers`);
    }

    private subscribeToMempool(ws: WebSocket) {
        mempoolSubscriptions.add(ws);
        console.log(`Mempool now has ${mempoolSubscriptions.size} subscribers`);
    }

    private unsubscribeFromTable(tableAddress: string, playerId: string) {
        const playerMap = tableSubscriptions.get(tableAddress);

        if (playerMap && playerMap.has(playerId)) {
            playerMap.delete(playerId);
            console.log(`Removed player ${playerId} from table ${tableAddress}`);

            if (playerMap.size === 0) {
                // If no more subscribers, remove the table entry
                tableSubscriptions.delete(tableAddress);
                console.log(`Removed table ${tableAddress} (no subscribers left)`);
            }
        }
    }

    private unsubscribeFromMempool(ws: WebSocket) {
        mempoolSubscriptions.delete(ws);
        console.log(`Mempool now has ${mempoolSubscriptions.size} subscribers`);
    }

    private handleDisconnect(ws: WebSocket) {
        // Remove this websocket from all table subscriptions
        for (const [tableAddress, playerMap] of tableSubscriptions.entries()) {
            // Find all players using this websocket
            const playersToRemove: string[] = [];

            for (const [playerId, playerWs] of playerMap.entries()) {
                if (playerWs === ws) {
                    playersToRemove.push(playerId);
                }
            }

            // Remove each player found
            for (const playerId of playersToRemove) {
                playerMap.delete(playerId);
                console.log(`Removed disconnected player ${playerId} from table ${tableAddress}`);
            }

            // If no players left for this table, remove the table
            if (playerMap.size === 0) {
                tableSubscriptions.delete(tableAddress);
                console.log(`Removed table ${tableAddress} (no subscribers left after disconnect)`);
            }
        }

        // Remove from mempool subscriptions
        mempoolSubscriptions.delete(ws);
    }

    // Method to send mempool data to a specific client
    private async sendMempoolToClient(ws: WebSocket) {
        try {
            const mempoolCommand = new MempoolCommand(this.validatorPrivateKey);
            const mempoolResult = await mempoolCommand.execute();
            
            const updateMessage: MempoolUpdateMessage = {
                type: "mempoolUpdate",
                transactions: mempoolResult.data.toJson()
            };

            this.sendMessage(ws, updateMessage);
            console.log("Sent initial mempool data to client");
        } catch (error) {
            console.error("Error sending mempool to client:", error);
        }
    }

    // Method to broadcast mempool updates to all subscribed clients
    public async broadcastMempoolUpdate() {
        if (mempoolSubscriptions.size === 0) {
            console.log("No mempool subscribers, skipping broadcast");
            return;
        }

        try {
            const mempoolCommand = new MempoolCommand(this.validatorPrivateKey);
            const mempoolResult = await mempoolCommand.execute();
            
            const updateMessage: MempoolUpdateMessage = {
                type: "mempoolUpdate",
                transactions: mempoolResult.data.toJson()
            };

            const message = JSON.stringify(updateMessage);
            console.log(`Broadcasting mempool update to ${mempoolSubscriptions.size} subscribers`);

            // Send to all mempool subscribers
            const disconnectedClients: WebSocket[] = [];
            
            for (const ws of mempoolSubscriptions) {
                if (ws.readyState === WebSocket.OPEN) {
                    try {
                        ws.send(message);
                    } catch (error) {
                        console.error("Error sending mempool update to client:", error);
                        disconnectedClients.push(ws);
                    }
                } else {
                    disconnectedClients.push(ws);
                }
            }

            // Clean up disconnected clients
            for (const ws of disconnectedClients) {
                mempoolSubscriptions.delete(ws);
            }

            if (disconnectedClients.length > 0) {
                console.log(`Cleaned up ${disconnectedClients.length} disconnected mempool clients`);
            }
        } catch (error) {
            console.error("Error broadcasting mempool update:", error);
        }
    }

    // Method to broadcast game state updates to a specific player
    public sendGameStateToPlayer(tableAddress: string, playerId: string, gameState: TexasHoldemStateDTO) {
        const playerMap = tableSubscriptions.get(tableAddress);
        if (!playerMap) {
            console.log(`No subscribers for table ${tableAddress}, skipping player update`);
            return;
        }

        const ws = playerMap.get(playerId);
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.log(`Player ${playerId} not connected or connection not open, skipping update`);
            return;
        }

        const updateMessage: GameStateUpdateMessage = {
            type: "gameStateUpdate",
            tableAddress,
            gameState
        };

        try {
            ws.send(JSON.stringify(updateMessage));
            console.log(`Sent game state update to player ${playerId} for table ${tableAddress}`);
        } catch (error) {
            console.error(`Error sending game state to player ${playerId}:`, error);

            // Clean up problematic connection
            playerMap.delete(playerId);
            if (playerMap.size === 0) {
                tableSubscriptions.delete(tableAddress);
            }
        }
    }

    // Method to broadcast game state updates to all players at a table
    public broadcastGameStateUpdate(tableAddress: string, playerId: string, gameState: TexasHoldemStateDTO) {
        const playerMap = tableSubscriptions.get(tableAddress);

        if (!playerMap || playerMap.size === 0) {
            console.log(`No subscribers for table ${tableAddress}, skipping broadcast`);
            return;
        }

        console.log(`Broadcasting game state update for table ${tableAddress} to ${playerMap.size} players`);

        const updateMessage: GameStateUpdateMessage = {
            type: "gameStateUpdate",
            tableAddress,
            gameState
        };

        const message = JSON.stringify(updateMessage);

        // Get player based on their ID
        const ws = playerMap.get(playerId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(message);
                console.log(`Sent game state update to player ${playerId} for table ${tableAddress}`);
            } catch (error) {
                console.error(`Error sending game state to player ${playerId}:`, error);
                playerMap.delete(playerId); // Clean up problematic connection
            }
        }

        // Clean up if no players are left
        if (playerMap.size === 0) {
            tableSubscriptions.delete(tableAddress);
            console.log(`Removed table ${tableAddress} (no valid connections left)`);
        }
    }

    // Method to broadcast game state updates to ALL subscribers of a table
    public broadcastGameStateToAllSubscribers(tableAddress: string): Promise<void> {
        return new Promise(async (resolve) => {
            const playerMap = tableSubscriptions.get(tableAddress);

            if (!playerMap || playerMap.size === 0) {
                console.log(`No subscribers for table ${tableAddress}, skipping broadcast`);
                resolve();
                return;
            }

            console.log(`Broadcasting game state update to ALL ${playerMap.size} subscribers for table ${tableAddress}`);

            const disconnectedClients: string[] = [];

            // Send personalized game state to each subscriber
            await Promise.all(
                Array.from(playerMap.entries()).map(async ([subscriberId, ws]) => {
                    if (ws.readyState === WebSocket.OPEN) {
                        try {
                            // Get game state from this subscriber's perspective
                            const gameStateCommand = new GameStateCommand(tableAddress, this.validatorPrivateKey, subscriberId);
                            const gameStateResponse = await gameStateCommand.execute();

                            const updateMessage: GameStateUpdateMessage = {
                                type: "gameStateUpdate",
                                tableAddress,
                                gameState: gameStateResponse.data
                            };

                            ws.send(JSON.stringify(updateMessage));
                            console.log(`Sent game state update to subscriber ${subscriberId} for table ${tableAddress}`);
                        } catch (error) {
                            console.error(`Error sending game state to subscriber ${subscriberId}:`, error);
                            disconnectedClients.push(subscriberId);
                        }
                    } else {
                        disconnectedClients.push(subscriberId);
                    }
                })
            );

            // Clean up disconnected clients
            for (const subscriberId of disconnectedClients) {
                playerMap.delete(subscriberId);
            }

            if (disconnectedClients.length > 0) {
                console.log(`Cleaned up ${disconnectedClients.length} disconnected clients from table ${tableAddress}`);
            }

            // Clean up if no players are left
            if (playerMap.size === 0) {
                tableSubscriptions.delete(tableAddress);
                console.log(`Removed table ${tableAddress} (no subscribers left)`);
            }

            resolve();
        });
    }

    // Get subscription information (for status endpoints)
    public getSubscriptionInfo() {
        const tableInfo: Record<string, any> = {};
        let totalPlayers = 0;

        for (const [tableAddress, playerMap] of tableSubscriptions.entries()) {
            const playerIds = Array.from(playerMap.keys());
            tableInfo[tableAddress] = {
                playerCount: playerMap.size,
                players: playerIds
            };
            totalPlayers += playerMap.size;
        }

        return {
            activeConnections: this.activeConnections,
            maxConnections: this.maxConnections,
            tableCount: tableSubscriptions.size,
            totalPlayers,
            mempoolSubscribers: mempoolSubscriptions.size,
            tables: tableInfo
        };
    }
}

let socketServiceInstance: SocketService | null = null;
export function initSocketServer(server: HttpServer, maxConnections: number = 100): SocketService {
    if (!socketServiceInstance) {
        const validatorKey = process.env.VALIDATOR_KEY || ZeroHash;
        socketServiceInstance = new SocketService(server, validatorKey, maxConnections);
    }
    return socketServiceInstance;
}

export function getSocketService(): SocketService | null {
    return socketServiceInstance;
}
