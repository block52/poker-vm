// src/socket/socket-server.ts
import { Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import GameState from "../schema/gameState";
import { getGameManagementInstance } from "../state/gameManagement";

// Map of table addresses to array of socket IDs
const tableSubscriptions: Map<string, string[]> = new Map();

export class SocketService {
    private io: SocketServer;

    constructor(server: HttpServer) {
        this.io = new SocketServer(server, {
            cors: {
                origin: "*", // In production, restrict this to trusted domains
                methods: ["GET", "POST"]
            }
        });

        this.setupSocketEvents();
        this.setupGameStateChangeListener();
    }

    private setupSocketEvents() {
        this.io.on("connection", (socket: Socket) => {
            console.log(`Socket connected: ${socket.id}`);

            // Handle subscription to a table
            socket.on("subscribe", (tableAddress: string) => {
                this.subscribeToTable(tableAddress, socket.id);
                console.log(`Socket ${socket.id} subscribed to table ${tableAddress}`);

                // Send current game state to the client immediately upon subscription
                this.sendCurrentGameState(tableAddress, socket.id);
            });

            // Handle unsubscription from a table
            socket.on("unsubscribe", (tableAddress: string) => {
                this.unsubscribeFromTable(tableAddress, socket.id);
                console.log(`Socket ${socket.id} unsubscribed from table ${tableAddress}`);
            });

            // Handle disconnection
            socket.on("disconnect", () => {
                this.handleDisconnect(socket.id);
                console.log(`Socket disconnected: ${socket.id}`);
            });
        });
    }

    private async sendCurrentGameState(tableAddress: string, socketId: string) {
        try {
            const gameManagement = getGameManagementInstance();
            const gameState = await gameManagement.get(tableAddress);

            if (gameState) {
                this.io.to(socketId).emit("gameStateUpdate", {
                    tableAddress,
                    gameState
                });
            }
        } catch (error) {
            console.error(`Error fetching game state for table ${tableAddress}:`, error);
        }
    }

    private subscribeToTable(tableAddress: string, socketId: string) {
        // Get existing subscriptions or create new array
        const subscriptions = tableSubscriptions.get(tableAddress) || [];

        // Add socket ID if not already subscribed
        if (!subscriptions.includes(socketId)) {
            subscriptions.push(socketId);
            tableSubscriptions.set(tableAddress, subscriptions);
        }
    }

    private unsubscribeFromTable(tableAddress: string, socketId: string) {
        const subscriptions = tableSubscriptions.get(tableAddress);

        if (subscriptions) {
            const updatedSubscriptions = subscriptions.filter(id => id !== socketId);

            if (updatedSubscriptions.length > 0) {
                tableSubscriptions.set(tableAddress, updatedSubscriptions);
            } else {
                // If no more subscribers, remove the table entry
                tableSubscriptions.delete(tableAddress);
            }
        }
    }

    private handleDisconnect(socketId: string) {
        // Remove this socket from all table subscriptions
        for (const [tableAddress, subscribers] of tableSubscriptions.entries()) {
            this.unsubscribeFromTable(tableAddress, socketId);
        }
    }

    private setupGameStateChangeListener() {
        // This is where we'd set up a watcher for game state changes
        // For MongoDB, we can use change streams to watch for updates
        this.setupMongooseChangeStream();
    }

    private setupMongooseChangeStream() {
        // Set up a change stream on the GameState collection
        const changeStream = GameState.watch();

        changeStream.on("change", async change => {
            try {
                if (change.operationType === "update" || change.operationType === "replace") {
                    // Get table address from the change document
                    const tableAddress = change.documentKey._id;

                    // Get updated game state
                    const gameStateDoc = await GameState.findById(tableAddress);

                    if (gameStateDoc) {
                        // Broadcast update to all subscribers of this table
                        this.broadcastGameStateUpdate(tableAddress, gameStateDoc.state);
                    }
                }
            } catch (error) {
                console.error("Error processing game state change:", error);
            }
        });

        changeStream.on("error", error => {
            console.error("Error in GameState change stream:", error);
            // Attempt to restart the change stream after a delay
            setTimeout(() => this.setupMongooseChangeStream(), 5000);
        });
    }

    // Method to manually broadcast game state updates (can be called from other parts of the app)
    public broadcastGameStateUpdate(tableAddress: string, gameState: TexasHoldemStateDTO) {
        const subscribers = tableSubscriptions.get(tableAddress);

        if (subscribers && subscribers.length > 0) {
            console.log(`Broadcasting game state update for table ${tableAddress} to ${subscribers.length} subscribers`);

            // Emit to all subscribed clients
            subscribers.forEach(socketId => {
                this.io.to(socketId).emit("gameStateUpdate", {
                    tableAddress,
                    gameState
                });
            });
        }
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
