// src/socket/socket-server.ts
import { Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";

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
        console.log("Socket.IO server initialized");
    }

    private setupSocketEvents() {
        this.io.on("connection", (socket: Socket) => {
            console.log(`Socket connected: ${socket.id}`);

            // Handle subscription to a table
            socket.on("subscribe", (tableAddress: string) => {
                this.subscribeToTable(tableAddress, socket.id);
                console.log(`Socket ${socket.id} subscribed to table ${tableAddress}`);

                // Join a room named after the table address for easier broadcasting
                socket.join(tableAddress);
            });

            // Handle unsubscription from a table
            socket.on("unsubscribe", (tableAddress: string) => {
                this.unsubscribeFromTable(tableAddress, socket.id);
                console.log(`Socket ${socket.id} unsubscribed from table ${tableAddress}`);

                // Leave the room
                socket.leave(tableAddress);
            });

            // Handle disconnection
            socket.on("disconnect", () => {
                this.handleDisconnect(socket.id);
                console.log(`Socket disconnected: ${socket.id}`);
            });
        });
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

    // Method to broadcast game state updates (can be called from anywhere in the application)
    public broadcastGameStateUpdate(tableAddress: string, gameState: TexasHoldemStateDTO) {
        const subscribers = tableSubscriptions.get(tableAddress);

        if (subscribers && subscribers.length > 0) {
            console.log(`Broadcasting game state update for table ${tableAddress} to ${subscribers.length} subscribers`);

            // Option 1: Emit to all subscribed clients individually
            // subscribers.forEach(socketId => {
            //   this.io.to(socketId).emit('gameStateUpdate', {
            //     tableAddress,
            //     gameState
            //   });
            // });

            // Option 2: More efficient - emit to the room (all sockets in the room receive the message)
            this.io.to(tableAddress).emit("gameStateUpdate", {
                tableAddress,
                gameState
            });
        } else {
            console.log(`No subscribers for table ${tableAddress}, skipping broadcast`);
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
