import { IGameStateDocument, IJSONModel } from "../../models/interfaces";
import { GameOptions, TexasHoldemGameState, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { IGameManagement } from "../interfaces";

import { Redis } from "ioredis";
import * as crypto from "crypto";

export class RedisGameManagement implements IGameManagement {
    private readonly redisClient: Redis;
    private readonly gamesKey: string;
    private readonly gameAddressIndex: string;
    private isConnected: boolean = false;

    /**
     * Constructor for RedisGameManagement
     * @param redisUrl Redis connection URL
     * @param namespace Optional namespace for Redis keys
     */
    constructor(redisUrl: string, namespace: string = "pvm") {
        this.redisClient = new Redis(redisUrl);
        this.gamesKey = `${namespace}:games`;
        this.gameAddressIndex = `${namespace}:games:addresses`;
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

    /**
     * Get all game states
     */
    public async getAll(): Promise<IGameStateDocument[]> {
        await this.connect();

        // Get all game IDs
        const gameIds = await this.redisClient.smembers(this.gamesKey);

        if (gameIds.length === 0) {
            return [];
        }

        // Use pipeline to get all games efficiently
        const pipeline = this.redisClient.pipeline();
        for (const gameId of gameIds) {
            pipeline.hgetall(`${this.gamesKey}:${gameId}`);
        }

        const results = await pipeline.exec();

        if (!results) {
            return [];
        }

        // Convert results to game state documents
        const games: IGameStateDocument[] = [];

        for (const [err, result] of results) {
            if (err) {
                console.error(`Error fetching game: ${err.message}`);
                continue;
            }

            if (result && Object.keys(result).length > 0) {
                // Parse JSON fields from Redis strings
                try {
                    // const gameState = this.parseGameState(result);
                    // games.push(gameState);
                } catch (error) {
                    console.error(`Error parsing game state: ${error}`);
                }
            }
        }

        return games;
    }

    /**
     * Get a game state by address
     * @param address Game contract address
     */
    public async get(address: string): Promise<any | null> {
        await this.connect();

        // First, get the game ID from the address index
        const gameId = await this.redisClient.hget(this.gameAddressIndex, address);

        if (!gameId) {
            return null;
        }

        // Now get the game data
        const gameData = await this.redisClient.hgetall(`${this.gamesKey}:${gameId}`);

        if (!gameData || Object.keys(gameData).length === 0) {
            return null;
        }

        // Parse and return the game state
        return this.parseGameState(gameData);
    }

    /**
     * Create a new game
     * @param nonce Game nonce
     * @param contractSchemaAddress Contract schema address
     * @param gameOptions Game options
     */
    public async create(nonce: bigint, contractSchemaAddress: string, gameOptions: GameOptions): Promise<string> {
        await this.connect();

        // Generate a unique ID for the game
        const gameId = this.generateGameId();

        // Create game address (this might need to be adjusted based on your actual logic)
        const gameAddress = this.generateGameAddress(contractSchemaAddress, nonce);

        // Prepare game state document
        const gameState: IGameStateDocument = {
            address: gameAddress,
            state: {},
        };

        // Save to Redis
        const multi = this.redisClient.multi();

        // Add to games set
        multi.sadd(this.gamesKey, gameId);

        // Index by address
        multi.hset(this.gameAddressIndex, gameAddress, gameId);

        // Store game data as hash
        const gameData = this.serializeGameState(gameState);
        multi.hmset(`${this.gamesKey}:${gameId}`, gameData);

        await multi.exec();

        return gameAddress;
    }

    /**
     * Save game state
     * @param state Game state model
     */
    public async save(state: IJSONModel, address: string): Promise<void> {
        await this.connect();

        // Get the game by its address
        const currentState = await this.get(address);

        if (!currentState) {
            throw new Error(`Game with address ${address} not found`);
        }

        // Update the state
        currentState.state = state.toJson();
        currentState.updatedAt = new Date();

        // Save back to Redis
        const gameData = this.serializeGameState(currentState);
        await this.redisClient.hmset(`${this.gamesKey}:${currentState._id}`, gameData);
    }

    /**
     * Save game state from JSON
     * @param json Game state JSON
     */
    public async saveFromJSON(json: any): Promise<void> {
        await this.connect();

        if (!json.address) {
            throw new Error("Game address is required");
        }

        // Get the game by its address
        const currentState = await this.get(json.address);

        if (!currentState) {
            throw new Error(`Game with address ${json.address} not found`);
        }

        // Update the state with JSON data
        currentState.state = json;
        currentState.updatedAt = new Date();

        // Save back to Redis
        const gameData = this.serializeGameState(currentState);
        await this.redisClient.hmset(`${this.gamesKey}:${currentState._id}`, gameData);
    }

    // Helper methods

    /**
     * Generate a unique game ID
     */
    private generateGameId(): string {
        return crypto.randomUUID();
    }

    /**
     * Generate a game address based on contract schema and nonce
     * Note: This is a simplified implementation, adjust as needed
     */
    private generateGameAddress(contractSchemaAddress: string, nonce: bigint): string {
        const hash = crypto.createHash("sha256");
        hash.update(`${contractSchemaAddress}:${nonce.toString()}`);
        return "0x" + hash.digest("hex").substring(0, 40);
    }

    /**
     * Parse a game state from Redis data
     */
    private parseGameState(data: Record<string, string>): IGameStateDocument {
        return {
            address: data.address,
            state: JSON.parse(data.state || "{}")
        };
    }

    /**
     * Serialize a game state for Redis storage
     */
    private serializeGameState(gameState: IGameStateDocument): Record<string, string> {
        return {
            address: gameState.address,
            state: JSON.stringify(gameState.state || {})
        };
    }

    /**
     * Reset all games (useful for testing)
     */
    public async reset(): Promise<void> {
        await this.connect();

        // Get all game IDs
        const gameIds = await this.redisClient.smembers(this.gamesKey);

        if (gameIds.length === 0) {
            return;
        }

        // Delete all game data
        const multi = this.redisClient.multi();

        // Remove from games set
        multi.del(this.gamesKey);

        // Delete address index
        multi.del(this.gameAddressIndex);

        // Delete each game's data
        for (const gameId of gameIds) {
            multi.del(`${this.gamesKey}:${gameId}`);
        }

        await multi.exec();
    }
}

// Singleton instance
let instance: RedisGameManagement;

export const getRedisGameManagementInstance = (): IGameManagement => {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    if (!instance) {
        instance = new RedisGameManagement(redisUrl);
    }
    return instance;
};
