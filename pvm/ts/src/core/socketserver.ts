import { Server as HttpServer } from "http";
import * as WebSocket from "ws";
import { TexasHoldemStateDTO, TransactionDTO } from "@bitcoinbrisbane/block52";
import * as url from "url";
import { verifySignature } from "../utils/crypto";
import { GameStateCommand } from "../commands";
import { ZeroHash } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { getCosmosConfig } from "../state/cosmos/config";

// Create logs directory if it doesn't exist
const LOGS_DIR = path.join(process.cwd(), "websocket-logs");
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
    console.log(`Created WebSocket logs directory: ${LOGS_DIR}`);
}

// Map of table addresses to map of player IDs to WebSocket connections
const tableSubscriptions: Map<string, Map<string, WebSocket>> = new Map();

// Set of WebSocket connections subscribed to mempool updates
const mempoolSubscriptions: Set<WebSocket> = new Set();

// Helper function to create safe filename from account address
function createSafeFilename(accountAddress: string): string {
    // Remove 0x prefix and convert to lowercase for consistency
    const cleanAddress = accountAddress.toLowerCase().replace(/^0x/, "");
    return `${cleanAddress}.log`;
}

// Enhanced logging function for WebSocket events
function logWebSocketEvent(playerId: string, eventType: string, data: any, direction: "OUTGOING" | "INCOMING" = "OUTGOING") {
    try {
        const timestamp = new Date().toISOString();
        const filename = createSafeFilename(playerId);
        const filepath = path.join(LOGS_DIR, filename);
        
        const logEntry = {
            timestamp,
            playerId: playerId.substring(0, 8) + "...", // Shortened for privacy
            direction,
            eventType,
            dataSize: JSON.stringify(data).length,
            data: data
        };
        
        const logLine = JSON.stringify(logEntry, null, 2) + "\n" + "=".repeat(80) + "\n";
        
        // Append to file (create if doesn't exist)
        fs.appendFileSync(filepath, logLine, "utf8");
        
        console.log(`📝 Logged ${direction} ${eventType} for ${playerId.substring(0, 8)}... (${JSON.stringify(data).length} bytes)`);
    } catch (error) {
        console.error("Error writing WebSocket log:", error);
    }
}

// Function to log connection events
function logConnectionEvent(playerId: string, event: string, details: any = {}) {
    logWebSocketEvent(playerId, `CONNECTION_${event}`, {
        event,
        ...details
    });
}

// Function to log subscription events  
function logSubscriptionEvent(playerId: string, tableAddress: string, event: string, details: any = {}) {
    logWebSocketEvent(playerId, `SUBSCRIPTION_${event}`, {
        event,
        tableAddress,
        ...details
    });
}

// Function to log game state events with detailed breakdown
function logGameStateEvent(playerId: string, tableAddress: string, gameState: TexasHoldemStateDTO, additionalContext: any = {}) {
    // Create a comprehensive snapshot of the game state
    const gameStateSnapshot = {
        round: gameState.round,
        nextToAct: gameState.nextToAct,
        dealer: gameState.dealer,
        playerCount: gameState.players.length,
        activePlayers: gameState.players.filter(p => p.status === 'active').length,
        potCount: gameState.pots.length,
        totalPotValue: gameState.pots.reduce((sum, pot) => sum + parseInt(pot), 0),
        communityCardCount: gameState.communityCards.length,
        handNumber: gameState.handNumber,
        actionCount: gameState.previousActions.length,
        lastActionTimestamp: gameState.previousActions.length > 0 ? 
            gameState.previousActions[gameState.previousActions.length - 1].timestamp : null
    };

    // Create detailed player data (excluding sensitive hole cards from logs but including legal actions)
    const playerData = gameState.players.map(player => {
        // Format legal actions in a readable way
        const legalActionsFormatted = player.legalActions?.map(action => ({
            action: action.action,
            minAmount: action.min,
            maxAmount: action.max,
            actionIndex: action.index
        })) || [];

        return {
            seat: player.seat,
            address: player.address.substring(0, 8) + "...", // Shortened for privacy
            status: player.status,
            stack: player.stack,
            hasHoleCards: !!player.holeCards,
            holeCardCount: player.holeCards ? player.holeCards.length : 0,
            ...(player.holeCards && player.holeCards.some(card => card !== "??") ? 
                { holeCards: player.holeCards } : 
                { holeCards: "HIDDEN" }),
            // Add legal actions for this player
            legalActions: legalActionsFormatted,
            legalActionCount: legalActionsFormatted.length,
            // Add specific info if this is the current player's perspective
            isCurrentPlayerView: player.address.toLowerCase() === playerId.toLowerCase(),
            // Add betting info
            isSmallBlind: player.isSmallBlind,
            isBigBlind: player.isBigBlind,
            isDealer: player.isDealer,
            sumOfBets: player.sumOfBets
        };
    });

    // Get recent actions (last 5)
    const recentActions = gameState.previousActions.slice(-5).map(action => ({
        timestamp: action.timestamp,
        seat: action.seat,
        action: action.action,
        amount: action.amount,
        round: action.round,
        index: action.index
    }));

    // Find the current player's legal actions specifically
    const currentPlayerData = gameState.players.find(p => p.address.toLowerCase() === playerId.toLowerCase());
    const currentPlayerLegalActions = currentPlayerData?.legalActions?.map(action => ({
        action: action.action,
        min: action.min,
        max: action.max,
        index: action.index
    })) || [];

    logWebSocketEvent(playerId, "GAME_STATE_UPDATE", {
        tableAddress,
        gameStateSnapshot,
        playerData,
        recentActions,
        // Add specific legal actions info for easy debugging
        currentPlayerPerspective: {
            address: playerId.substring(0, 8) + "...",
            legalActions: currentPlayerLegalActions,
            legalActionCount: currentPlayerLegalActions.length,
            canAct: currentPlayerLegalActions.length > 0,
            isTheirTurn: gameState.players.find(p => p.seat === gameState.nextToAct)?.address.toLowerCase() === playerId.toLowerCase()
        },
        // Add table state for context
        tableState: {
            communityCards: gameState.communityCards,
            totalPot: gameState.pots.reduce((sum, pot) => sum + parseInt(pot), 0),
            dealerSeat: gameState.dealer,
            smallBlindSeat: gameState.players.find(p => p.isSmallBlind)?.seat,
            bigBlindSeat: gameState.players.find(p => p.isBigBlind)?.seat
        },
        ...additionalContext
    });
}

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

// type MempoolSubscribeMessage = {
//     action: "subscribe_mempool";
// };

// type MempoolUnsubscribeMessage = {
//     action: "unsubscribe_mempool";
// };

type ClientMessage = SubscribeMessage | UnsubscribeMessage; // | MempoolSubscribeMessage | MempoolUnsubscribeMessage;

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
    // broadcastMempoolUpdate(): Promise<void>;
    // getMempoolSubscriberCount(): number;
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

    // public getMempoolSubscriberCount(): number {
    //     return mempoolSubscriptions.size;
    // }

    private setupSocketEvents() {
        console.log("Setting up WebSocket events");

        this.wss.on("connection", async (ws: WebSocket, req: any) => {
            // Check if we've reached the connection limit
            if (this.activeConnections >= this.maxConnections) {
                console.log(`Connection limit reached (${this.maxConnections}). Rejecting new connection.`);
                ws.close(1013, "Maximum number of connections reached"); // 1013 = "Try again later"
                return;
            }

            // Declare variables at function scope so they're available throughout
            let tableAddress: string | undefined;
            let playerId: string | undefined;
            // let subscribeMempool: string | undefined;

            try {
                this.activeConnections++;
                console.log(`WebSocket connected from ${req.socket.remoteAddress}`);

                // Try to get tableAddress and playerId from URL query parameters
                const parsedUrl = url.parse(req.url || "", true);
                tableAddress = parsedUrl.query.tableAddress as string;
                playerId = parsedUrl.query.playerId as string;
                // subscribeMempool = parsedUrl.query.subscribeMempool as string;

                // If tableAddress and playerId are provided in URL, auto-subscribe
                if (tableAddress && playerId) {
                    // Log connection establishment
                    logConnectionEvent(playerId, "ESTABLISHED", {
                        remoteAddress: req.socket.remoteAddress,
                        userAgent: req.headers["user-agent"],
                        tableAddress,
                        autoSubscribe: true
                    });

                    this.subscribeToTable(tableAddress, playerId, ws);
                    console.log(`Auto-subscribed player ${playerId} to table ${tableAddress}`);

                    // Log auto-subscription
                    logSubscriptionEvent(playerId, tableAddress, "AUTO_SUBSCRIBED", {
                        method: "URL_PARAMS"
                    });

                    // Get initial game state for this table from Cosmos
                    const cosmosConfig = getCosmosConfig();
                    // ✅ FIX: Pass playerId as caller so player sees their own hole cards
                    const gameStateCommand = new GameStateCommand(tableAddress, playerId, cosmosConfig.restEndpoint);
                    const state = await gameStateCommand.execute();

                    // Log detailed game state
                    logGameStateEvent(playerId, tableAddress, state, {
                        triggerType: "INITIAL_CONNECTION",
                        method: "setupSocketEvents"
                    });

                    // Send initial game state to the newly connected player
                    this.sendGameStateToPlayer(tableAddress, playerId, state);
                } else if (playerId) {
                    // Log connection even without auto-subscribe
                    logConnectionEvent(playerId, "ESTABLISHED", {
                        remoteAddress: req.socket.remoteAddress,
                        userAgent: req.headers["user-agent"],
                        autoSubscribe: false
                    });
                }

                // // If subscribeMempool is provided in URL, auto-subscribe to mempool
                // if (subscribeMempool === "true") {
                //     this.subscribeToMempool(ws);
                //     console.log("Auto-subscribed to mempool updates");

                //     // Send initial mempool state
                //     await this.sendMempoolToClient(ws);
                // }
            } catch (error) {
                this.activeConnections--;

                // Check if this is a 404 game not found error
                const isGameNotFound = (error as any)?.response?.status === 404 ||
                                      (error as any)?.status === 404;

                // Log error concisely (don't dump entire error object)
                if (isGameNotFound) {
                    console.log(`⚠️  Game not found: ${tableAddress || "unknown table"}`);
                } else {
                    console.error(`❌ Error during WebSocket connection setup: ${error instanceof Error ? error.message : String(error)}`);
                }

                // Log error if we have playerId
                if (playerId) {
                    logConnectionEvent(playerId, "SETUP_ERROR", {
                        error: error instanceof Error ? error.message : String(error),
                        isGameNotFound
                    });
                }

                // Send user-friendly error message to client before closing
                try {
                    if (isGameNotFound && tableAddress) {
                        // Send specific game not found error
                        const errorMessage = {
                            type: "error",
                            code: "GAME_NOT_FOUND",
                            message: `Game with ID ${tableAddress} does not exist on this chain`,
                            details: {
                                tableAddress,
                                suggestion: "This game may not have been created yet, or it may exist on a different blockchain."
                            }
                        };
                        ws.send(JSON.stringify(errorMessage));
                        console.log(`Sent game not found error to client for table ${tableAddress}`);

                        // Close with code 1008 (Policy Violation) for game not found
                        ws.close(1008, "Game not found");
                    } else {
                        // Send generic error message
                        const errorMessage = {
                            type: "error",
                            code: "CONNECTION_ERROR",
                            message: error instanceof Error ? error.message : "Failed to establish connection",
                            details: {}
                        };
                        ws.send(JSON.stringify(errorMessage));

                        // Close with code 1011 (Internal Error) for other errors
                        ws.close(1011, "Internal server error");
                    }
                } catch (sendError) {
                    console.error("Failed to send error message to client:", sendError);
                    // Close connection anyway
                    ws.close(1011, "Internal server error");
                }

                return;
            }

            // Handle messages from client
            ws.on("message", (message: WebSocket.Data) => {
                try {
                    // Convert Buffer to string if necessary
                    const messageStr = message instanceof Buffer ? message.toString("utf8") : message.toString();
                    const data = JSON.parse(messageStr) as ClientMessage;

                    // Log incoming message
                    if (data.action === "subscribe" && data.playerId) {
                        logWebSocketEvent(data.playerId, "INCOMING_SUBSCRIBE", data, "INCOMING");
                    }

                    if (data.action === "subscribe" && data.tableAddress && data.playerId) {
                        if (!verifySignature(data.playerId, data.signature || "", data.tableAddress)) {
                            console.log(`Signature verified for player ${data.playerId} on table ${data.tableAddress}`);
                            return;
                        }

                        this.subscribeToTable(data.tableAddress, data.playerId, ws);
                        console.log(`Subscribed player ${data.playerId} to table ${data.tableAddress}`);

                        // Log subscription
                        logSubscriptionEvent(data.playerId, data.tableAddress, "SUBSCRIBED", {
                            method: "MESSAGE"
                        });

                        // Send confirmation
                        this.sendMessage(ws, {
                            type: "subscribed",
                            tableAddress: data.tableAddress,
                            playerId: data.playerId
                        }, data.playerId);
                    }

                    if (data.action === "unsubscribe" && data.tableAddress && data.playerId) {
                        this.unsubscribeFromTable(data.tableAddress, data.playerId);
                        console.log(`Unsubscribed player ${data.playerId} from table ${data.tableAddress}`);

                        // Log unsubscription
                        logSubscriptionEvent(data.playerId, data.tableAddress, "UNSUBSCRIBED", {
                            method: "MESSAGE"
                        });

                        // Send confirmation
                        this.sendMessage(ws, {
                            type: "unsubscribed",
                            tableAddress: data.tableAddress,
                            playerId: data.playerId
                        }, data.playerId);
                    }

                    // if (data.action === "subscribe_mempool") {
                    //     this.subscribeToMempool(ws);
                    //     console.log("Client subscribed to mempool updates");

                    //     // Send initial mempool state
                    //     this.sendMempoolToClient(ws);

                    //     // Send confirmation
                    //     this.sendMessage(ws, {
                    //         type: "mempool_subscribed"
                    //     });
                    // }

                    // if (data.action === "unsubscribe_mempool") {
                    //     this.unsubscribeFromMempool(ws);
                    //     console.log("Client unsubscribed from mempool updates");

                    //     // Send confirmation
                    //     this.sendMessage(ws, {
                    //         type: "mempool_unsubscribed"
                    //     });
                    // }

                    if (!["subscribe", "unsubscribe"].includes(data.action)) {
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
                
                // Log disconnection if we can identify the player
                if (playerId) {
                    logConnectionEvent(playerId, "DISCONNECTED", {
                        reason: "CLIENT_CLOSE"
                    });
                }
                
                this.handleDisconnect(ws);
            });

            // Send welcome message
            const welcomeMessage = {
                type: "connected",
                message: "Connected to PVM WebSocket Server"
            };
            this.sendMessage(ws, welcomeMessage, playerId);
            
            // Log welcome message
            if (playerId) {
                logWebSocketEvent(playerId, "OUTGOING_CONNECTED", welcomeMessage);
            }
        });
    }

    private sendMessage(ws: WebSocket, data: any, playerId?: string) {
        if (ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify(data));
                
                // Log outgoing message if we have a playerId
                if (playerId) {
                    logWebSocketEvent(playerId, "OUTGOING_MESSAGE", data);
                }
            } catch (error) {
                console.error("Error sending WebSocket message:", error);
                
                // Log error if we have a playerId
                if (playerId) {
                    logWebSocketEvent(playerId, "SEND_ERROR", {
                        error: error instanceof Error ? error.message : String(error),
                        dataType: data.type
                    });
                }
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

    // private subscribeToMempool(ws: WebSocket) {
    //     mempoolSubscriptions.add(ws);
    //     console.log(`Mempool now has ${mempoolSubscriptions.size} subscribers`);
    // }

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

    // private unsubscribeFromMempool(ws: WebSocket) {
    //     mempoolSubscriptions.delete(ws);
    //     console.log(`Mempool now has ${mempoolSubscriptions.size} subscribers`);
    // }

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
                
                // Log disconnection cleanup
                logConnectionEvent(playerId, "CLEANUP_DISCONNECT", {
                    tableAddress,
                    reason: "WebSocket disconnect"
                });
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

    // // Method to send mempool data to a specific client
    // private async sendMempoolToClient(ws: WebSocket) {
    //     try {
    //         const mempoolCommand = new MempoolCommand(this.validatorPrivateKey);
    //         const mempoolResult = await mempoolCommand.execute();
            
    //         const updateMessage: MempoolUpdateMessage = {
    //             type: "mempoolUpdate",
    //             transactions: mempoolResult.data.toJson()
    //         };

    //         this.sendMessage(ws, updateMessage);
    //         console.log("Sent initial mempool data to client");
    //     } catch (error) {
    //         console.error("Error sending mempool to client:", error);
    //     }
    // }

    // // Method to broadcast mempool updates to all subscribed clients
    // public async broadcastMempoolUpdate() {
    //     if (mempoolSubscriptions.size === 0) {
    //         console.log("No mempool subscribers, skipping broadcast");
    //         return;
    //     }

    //     try {
    //         const mempoolCommand = new MempoolCommand(this.validatorPrivateKey);
    //         const mempoolResult = await mempoolCommand.execute();
            
    //         const updateMessage: MempoolUpdateMessage = {
    //             type: "mempoolUpdate",
    //             transactions: mempoolResult.data.toJson()
    //         };

    //         const message = JSON.stringify(updateMessage);
    //         console.log(`Broadcasting mempool update to ${mempoolSubscriptions.size} subscribers`);

    //         // Send to all mempool subscribers
    //         const disconnectedClients: WebSocket[] = [];
            
    //         for (const ws of mempoolSubscriptions) {
    //             if (ws.readyState === WebSocket.OPEN) {
    //                 try {
    //                     ws.send(message);
    //                 } catch (error) {
    //                     console.error("Error sending mempool update to client:", error);
    //                     disconnectedClients.push(ws);
    //                 }
    //             } else {
    //                 disconnectedClients.push(ws);
    //             }
    //         }

    //         // Clean up disconnected clients
    //         for (const ws of disconnectedClients) {
    //             mempoolSubscriptions.delete(ws);
    //         }

    //         if (disconnectedClients.length > 0) {
    //             console.log(`Cleaned up ${disconnectedClients.length} disconnected mempool clients`);
    //         }
    //     } catch (error) {
    //         console.error("Error broadcasting mempool update:", error);
    //     }
    // }

    // Method to broadcast game state updates to a specific player
    public sendGameStateToPlayer(tableAddress: string, playerId: string, gameState: TexasHoldemStateDTO) {
        const playerMap = tableSubscriptions.get(tableAddress);
        if (!playerMap) {
            console.log(`No subscribers for table ${tableAddress}, skipping player update`);
            
            // Log the skip event
            logWebSocketEvent(playerId, "GAME_STATE_SKIP_NO_SUBSCRIBERS", {
                tableAddress,
                reason: "No subscribers for table"
            });
            return;
        }

        const ws = playerMap.get(playerId);
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.log(`Player ${playerId} not connected or connection not open, skipping update`);
            
            // Log the skip event
            logWebSocketEvent(playerId, "GAME_STATE_SKIP_CONNECTION", {
                tableAddress,
                reason: ws ? "Connection not open" : "Player not found in subscribers",
                connectionState: ws ? ws.readyState : "NO_WEBSOCKET"
            });
            return;
        }

        // Log the detailed game state before sending
        logGameStateEvent(playerId, tableAddress, gameState, {
            triggerType: "DIRECT_SEND",
            method: "sendGameStateToPlayer"
        });

        // 🃏 DEBUG: Log hole cards being sent to this player
        console.log(`🃏 [HOLE CARDS DEBUG - PVM SENDING via sendGameStateToPlayer] Player: ${playerId.substring(0, 12)}...`, {
            players: gameState.players.map((p: any) => ({
                seat: p.seat,
                address: p.address?.substring(0, 12) + "...",
                holeCards: p.holeCards,
                isCurrentPlayer: p.address?.toLowerCase() === playerId.toLowerCase()
            }))
        });

        const updateMessage: GameStateUpdateMessage = {
            type: "gameStateUpdate",
            tableAddress,
            gameState
        };

        try {
            ws.send(JSON.stringify(updateMessage));
            console.log(`Sent game state update to player ${playerId} for table ${tableAddress}`);
            
            // Log successful send
            logWebSocketEvent(playerId, "GAME_STATE_SENT_SUCCESS", {
                tableAddress,
                round: gameState.round,
                nextToAct: gameState.nextToAct,
                messageSize: JSON.stringify(updateMessage).length
            });
        } catch (error) {
            console.error(`Error sending game state to player ${playerId}:`, error);
            
            // Log send error
            logWebSocketEvent(playerId, "GAME_STATE_SEND_ERROR", {
                tableAddress,
                error: error instanceof Error ? error.message : String(error),
                round: gameState.round
            });

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
            
            // Log broadcast skip
            logWebSocketEvent(playerId, "BROADCAST_SKIP_NO_SUBSCRIBERS", {
                tableAddress,
                reason: "No subscribers for table"
            });
            return;
        }

        console.log(`Broadcasting game state update for table ${tableAddress} to ${playerMap.size} players`);

        // Log broadcast initiation
        logWebSocketEvent(playerId, "BROADCAST_INITIATED", {
            tableAddress,
            subscriberCount: playerMap.size,
            round: gameState.round,
            targetPlayer: playerId
        });

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
                
                // Log detailed game state for this specific player
                logGameStateEvent(playerId, tableAddress, gameState, {
                    triggerType: "BROADCAST_SINGLE",
                    method: "broadcastGameStateUpdate"
                });
                
                // Log successful broadcast send
                logWebSocketEvent(playerId, "BROADCAST_SENT_SUCCESS", {
                    tableAddress,
                    round: gameState.round,
                    messageSize: message.length
                });
            } catch (error) {
                console.error(`Error sending game state to player ${playerId}:`, error);
                
                // Log broadcast error
                logWebSocketEvent(playerId, "BROADCAST_SEND_ERROR", {
                    tableAddress,
                    error: error instanceof Error ? error.message : String(error),
                    round: gameState.round
                });
                
                playerMap.delete(playerId); // Clean up problematic connection
            }
        } else {
            // Log connection issue
            logWebSocketEvent(playerId, "BROADCAST_SKIP_CONNECTION", {
                tableAddress,
                reason: ws ? "Connection not open" : "Player not in subscriber map",
                connectionState: ws ? ws.readyState : "NO_WEBSOCKET"
            });
        }

        // Clean up if no players are left
        if (playerMap.size === 0) {
            tableSubscriptions.delete(tableAddress);
            console.log(`Removed table ${tableAddress} (no valid connections left)`);
        }
    }

    // Method to broadcast game state updates to ALL subscribers of a table
    public async broadcastGameStateToAllSubscribers(tableAddress: string): Promise<void> {
        const playerMap = tableSubscriptions.get(tableAddress);

        if (!playerMap || playerMap.size === 0) {
            console.log(`No subscribers for table ${tableAddress}, skipping broadcast`);
            return;
        }

        console.log(`🔄 [TIMING DEBUG] Broadcasting game state update to ALL ${playerMap.size} subscribers for table ${tableAddress}`);

        const disconnectedClients: string[] = [];

        // Send personalized game state to each subscriber
        await Promise.all(
            Array.from(playerMap.entries()).map(async ([subscriberId, ws]) => {
                if (ws.readyState === WebSocket.OPEN) {
                    try {
                        // 🔍 TIMING DEBUG: Log before getting game state
                        console.log(`🔄 [TIMING DEBUG] Getting game state for subscriber ${subscriberId} at ${new Date().toISOString()}`);

                        // Get game state from this subscriber's perspective from Cosmos
                        const cosmosConfig = getCosmosConfig();
                        // ✅ FIX: Pass subscriberId as caller so each player sees their own hole cards
                        const gameStateCommand = new GameStateCommand(tableAddress, subscriberId, cosmosConfig.restEndpoint);
                        const gameStateResponse = await gameStateCommand.execute();

                        // 🃏 DEBUG: Log hole cards being sent to this subscriber
                        console.log(`🃏 [HOLE CARDS DEBUG - PVM SENDING] Subscriber: ${subscriberId.substring(0, 12)}...`, {
                            players: gameStateResponse.players.map((p: any) => ({
                                seat: p.seat,
                                address: p.address?.substring(0, 12) + "...",
                                holeCards: p.holeCards,
                                isCurrentPlayer: p.address?.toLowerCase() === subscriberId.toLowerCase()
                            }))
                        });

                        // 🔍 TIMING DEBUG: Log the game state being sent via WebSocket
                        console.log(`🔄 [TIMING DEBUG] Broadcasting to subscriber ${subscriberId}:`, {
                            timestamp: new Date().toISOString(),
                            tableAddress,
                            nextToAct: gameStateResponse.nextToAct,
                            round: gameStateResponse.round,
                            playerCount: gameStateResponse.players.length,
                            lastAction: gameStateResponse.previousActions[gameStateResponse.previousActions.length - 1]?.action || "NO_ACTIONS",
                            lastActionIndex: gameStateResponse.previousActions[gameStateResponse.previousActions.length - 1]?.index || "NO_INDEX",
                            actionCount: gameStateResponse.previousActions.length,
                            source: "WebSocket broadcastGameStateToAllSubscribers"
                        });

                        // Log detailed game state for this subscriber
                        logGameStateEvent(subscriberId, tableAddress, gameStateResponse, {
                            triggerType: "BROADCAST_ALL",
                            method: "broadcastGameStateToAllSubscribers",
                            broadcastTimestamp: new Date().toISOString()
                        });

                        const updateMessage: GameStateUpdateMessage = {
                            type: "gameStateUpdate",
                            tableAddress,
                            gameState: gameStateResponse
                        };

                        ws.send(JSON.stringify(updateMessage));
                        console.log(`Sent game state update to subscriber ${subscriberId} for table ${tableAddress}`);
                        
                        // Log successful send
                        logWebSocketEvent(subscriberId, "BROADCAST_ALL_SENT_SUCCESS", {
                            tableAddress,
                            round: gameStateResponse.round,
                            nextToAct: gameStateResponse.nextToAct,
                            messageSize: JSON.stringify(updateMessage).length
                        });
                    } catch (error) {
                        console.error(`Error sending game state to subscriber ${subscriberId}:`, error);
                        
                        // Log broadcast error
                        logWebSocketEvent(subscriberId, "BROADCAST_ALL_SEND_ERROR", {
                            tableAddress,
                            error: error instanceof Error ? error.message : String(error)
                        });
                        
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
            tables: tableInfo,
            logsDirectory: LOGS_DIR,
            availableLogFiles: this.getAvailableLogFiles()
        };
    }

    // Get list of available log files
    public getAvailableLogFiles(): { filename: string; accountAddress: string; fileSize: number; lastModified: Date }[] {
        try {
            const files = fs.readdirSync(LOGS_DIR);
            return files
                .filter(filename => filename.endsWith('.log'))
                .map(filename => {
                    const filepath = path.join(LOGS_DIR, filename);
                    const stats = fs.statSync(filepath);
                    const accountAddress = "0x" + filename.replace('.log', '');
                    
                    return {
                        filename,
                        accountAddress,
                        fileSize: stats.size,
                        lastModified: stats.mtime
                    };
                })
                .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
        } catch (error) {
            console.error("Error reading log files:", error);
            return [];
        }
    }

    // Get log content for a specific player
    public getPlayerLogContent(accountAddress: string, maxLines: number = 100): string[] {
        try {
            const filename = createSafeFilename(accountAddress);
            const filepath = path.join(LOGS_DIR, filename);
            
            if (!fs.existsSync(filepath)) {
                return [`No log file found for account: ${accountAddress}`];
            }
            
            const content = fs.readFileSync(filepath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim().length > 0);
            
            // Return last N lines
            return lines.slice(-maxLines);
        } catch (error) {
            console.error("Error reading player log:", error);
            return [`Error reading log for account: ${accountAddress}`];
        }
    }

    // Clear logs older than specified days
    public clearOldLogs(daysOld: number = 7): number {
        try {
            const files = fs.readdirSync(LOGS_DIR);
            const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
            let deletedCount = 0;
            
            for (const filename of files) {
                if (filename.endsWith('.log')) {
                    const filepath = path.join(LOGS_DIR, filename);
                    const stats = fs.statSync(filepath);
                    
                    if (stats.mtime.getTime() < cutoffTime) {
                        fs.unlinkSync(filepath);
                        deletedCount++;
                        console.log(`Deleted old log file: ${filename}`);
                    }
                }
            }
            
            console.log(`Cleaned up ${deletedCount} old log files`);
            return deletedCount;
        } catch (error) {
            console.error("Error cleaning up old logs:", error);
            return 0;
        }
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
