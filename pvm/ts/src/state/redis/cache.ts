import { IGameStateDocument, IJSONModel } from "../../models/interfaces";
import { GameOptions } from "@bitcoinbrisbane/block52";
import { IGameManagement } from "../interfaces";
import { Redis } from "ioredis";
import * as crypto from "crypto";
import { IDB } from "../../data/interfaces";

export class Cache {
    private readonly redisClient: Redis;
    private isConnected: boolean = false;

    /**
     * Constructor for RedisGameManagement
     * @param redisUrl Redis connection URL
     * @param namespace Optional namespace for Redis keys
     */
    constructor(redisUrl: string, namespace: string = "pvm") {
        this.redisClient = new Redis(redisUrl);
    }

    /**
     * Connect to Redis
     */
    public async connect(): Promise<void> {
        if (!this.isConnected) {
            try {
                // Ping Redis to ensure connection is valid
                await this.redisClient.ping();
                this.isConnected = true;
            } catch (error) {
                throw new Error(`Failed to connect to Redis: ${error}`);
            }
        }
    }

    /**
     * Disconnect from Redis
     */
    public async disconnect(): Promise<void> {
        if (this.isConnected) {
            await this.redisClient.quit();
            this.isConnected = false;
        }
    }

    public getByHash(address: string): Promise<IGameStateDocument | null> {
        throw new Error("Method not implemented.");
    }
}