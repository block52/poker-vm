import mongoose from "mongoose";

import { IDB } from "./interfaces";

class DatabaseConnection implements IDB {
    private static instance: DatabaseConnection;
    private isConnected: boolean = false;

    private constructor() {}

    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    public async connect(uri: string = "mongodb://localhost:27017/pvm"): Promise<void> {
        if (this.isConnected) {
            console.log("Using existing database connection");
            return;
        }

        try {
            // const uri = process.env.DB_URL || "mongodb://localhost:27017/pvm";
            await mongoose.connect(uri);
            this.isConnected = true;
            console.log(`MongoDB connected to ${uri}`);
        } catch (error) {
            console.error("Error connecting to database:", error);
            process.exit(1);
        }

        // Handle connection events
        mongoose.connection.on("disconnected", () => {
            console.log("Database connection lost");
            this.isConnected = false;
        });

        mongoose.connection.on("error", err => {
            console.error("Database connection error:", err);
            this.isConnected = false;
        });
    }

    public async disconnect(): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        try {
            await mongoose.disconnect();
            this.isConnected = false;
            console.log("Database disconnected");
        } catch (error) {
            console.error("Error disconnecting from database:", error);
            throw error;
        }
    }

    public getConnection(): mongoose.Connection {
        return mongoose.connection;
    }
}

export const connectDB = DatabaseConnection.getInstance();
