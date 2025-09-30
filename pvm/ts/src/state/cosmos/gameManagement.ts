import { IGameManagement } from "../interfaces";
import { IGameStateDocument, IJSONModel } from "../../models/interfaces";
import { GameOptions, TexasHoldemGameState, TexasHoldemRound, GameOptionsDTO, GameType } from "@bitcoinbrisbane/block52";
import { CosmosClient, getCosmosClient } from "./cosmosClient";
import { createAddress } from "../../utils/crypto";
import { Deck } from "../../models";
import { ethers } from "ethers";

/**
 * Cosmos-based Game Management
 * Uses Cosmos SDK for blockchain state and custom storage for game-specific data
 * In a production setup, this would use CosmWasm smart contracts or a custom Cosmos module
 */
export class CosmosGameManagement implements IGameManagement {
    private cosmosClient: CosmosClient;
    private gameStates: Map<string, IGameStateDocument> = new Map();

    constructor() {
        this.cosmosClient = getCosmosClient();
    }

    /**
     * Get all game states
     */
    public async getAll(): Promise<IGameStateDocument[]> {
        return Array.from(this.gameStates.values());
    }

    /**
     * Get game state by address
     */
    public async getByAddress(address: string): Promise<IGameStateDocument | null> {
        const gameState = this.gameStates.get(address);
        return gameState || null;
    }

    /**
     * Get game options for a specific game
     */
    public async getGameOptions(address: string): Promise<GameOptions> {
        const gameState = this.gameStates.get(address);

        if (!gameState) {
            throw new Error(`Game not found for address: ${address}`);
        }

        // Convert stored DTO back to GameOptions with BigInt
        const gameOptionsDto = gameState.gameOptions as any;
        const gameOptions: GameOptions = {
            minBuyIn: BigInt(gameOptionsDto.minBuyIn || "0"),
            maxBuyIn: BigInt(gameOptionsDto.maxBuyIn || "0"),
            minPlayers: gameOptionsDto.minPlayers || 2,
            maxPlayers: gameOptionsDto.maxPlayers || 6,
            smallBlind: BigInt(gameOptionsDto.smallBlind || "0"),
            bigBlind: BigInt(gameOptionsDto.bigBlind || "0"),
            timeout: gameOptionsDto.timeout || 30000,
            type: gameOptionsDto.type || GameType.CASH
        };

        return gameOptions;
    }

    /**
     * Get game state data
     */
    public async getState(address: string): Promise<TexasHoldemGameState | null> {
        const gameState = this.gameStates.get(address);
        return gameState ? gameState.state as TexasHoldemGameState : null;
    }

    /**
     * Create a new game
     * In a production Cosmos SDK setup, this would be a transaction to a custom module
     */
    public async create(nonce: bigint, owner: string, gameOptions: GameOptions, timestamp?: string): Promise<string> {
        try {
            // Generate game address (deterministic based on owner and nonce)
            const digest = `${owner}:${nonce.toString()}:${timestamp || Date.now()}`;
            const address = createAddress(digest);

            // Create initial deck
            const deck = new Deck();
            const seedArray = [Date.now() % 1000, Number(nonce) % 1000];
            deck.shuffle(seedArray);

            // Create initial game state
            const state: TexasHoldemGameState = {
                type: gameOptions.type,
                address: address,
                minBuyIn: gameOptions.minBuyIn.toString(),
                maxBuyIn: gameOptions.maxBuyIn.toString(),
                minPlayers: gameOptions.minPlayers,
                maxPlayers: gameOptions.maxPlayers,
                smallBlind: gameOptions.smallBlind.toString(),
                bigBlind: gameOptions.bigBlind.toString(),
                dealer: gameOptions.maxPlayers, // Dealer is the last player (1 based index)
                players: [],
                deck: deck.toString(),
                communityCards: [],
                pots: ["0"],
                lastActedSeat: -1,
                actionCount: 0,
                handNumber: 0,
                round: TexasHoldemRound.ANTE,
                winners: [],
                results: [],
                signature: ethers.ZeroHash
            };

            // Convert gameOptions to DTO for storage (BigInt to string)
            const gameOptionsDTO: GameOptionsDTO = {
                minBuyIn: gameOptions.minBuyIn.toString(),
                maxBuyIn: gameOptions.maxBuyIn.toString(),
                minPlayers: gameOptions.minPlayers,
                maxPlayers: gameOptions.maxPlayers,
                smallBlind: gameOptions.smallBlind.toString(),
                bigBlind: gameOptions.bigBlind.toString(),
                timeout: gameOptions.timeout,
                type: gameOptions.type
            };

            // Create game state document
            const gameStateDoc: IGameStateDocument = {
                address: address,
                gameOptions: gameOptionsDTO as any, // Store as DTO in state
                state: state
            };

            // Store in memory (in production, this would be stored in Cosmos SDK state)
            this.gameStates.set(address, gameStateDoc);

            // In a real Cosmos SDK implementation, this would be:
            // 1. A transaction to create the game in a custom module
            // 2. Storage in the blockchain state tree
            // 3. Events emitted for game creation
            console.log(`Created game at address: ${address}`);

            // Log to Cosmos SDK (in production, this would be a transaction)
            await this.logGameCreation(address, owner, gameOptions);

            return address;
        } catch (error) {
            console.error("Error creating game:", error);
            throw error;
        }
    }

    /**
     * Save game state
     * In production, this would update the Cosmos SDK state
     */
    public async save(state: IJSONModel): Promise<void> {
        try {
            const stateJson = state.toJson();
            const address = stateJson.address;

            if (!address) {
                throw new Error("Game state must have an address");
            }

            const existingGame = this.gameStates.get(address);

            if (existingGame) {
                // Update existing game state
                existingGame.state = stateJson.state || stateJson;
                this.gameStates.set(address, existingGame);
            } else {
                // Create new game state document
                const newGameState: IGameStateDocument = {
                    address: address,
                    gameOptions: stateJson.gameOptions || {},
                    state: stateJson.state || stateJson
                };
                this.gameStates.set(address, newGameState);
            }

            // In production Cosmos SDK, this would be a state update transaction
            console.log(`Saved game state for address: ${address}`);
        } catch (error) {
            console.error("Error saving game state:", error);
            throw error;
        }
    }

    /**
     * Save game state from JSON
     */
    public async saveFromJSON(json: any): Promise<void> {
        try {
            const address = json.address;

            if (!address) {
                throw new Error("Game state JSON must have an address");
            }

            const gameStateDoc: IGameStateDocument = {
                address: address,
                gameOptions: json.gameOptions || {},
                state: json.state || json
            };

            this.gameStates.set(address, gameStateDoc);

            console.log(`Saved game state from JSON for address: ${address}`);
        } catch (error) {
            console.error("Error saving game state from JSON:", error);
            throw error;
        }
    }

    /**
     * Log game creation to Cosmos SDK
     * In production, this would be part of the game creation transaction
     */
    private async logGameCreation(address: string, owner: string, gameOptions: GameOptions): Promise<void> {
        try {
            // In production, this would be:
            // 1. Part of a custom Cosmos SDK module transaction
            // 2. Stored in the blockchain state
            // 3. Emit events for indexing

            const height = await this.cosmosClient.getHeight();
            console.log(`Game created at block height ${height}: ${address} by ${owner}`);

            // Store metadata about the game creation
            const metadata = {
                address,
                owner,
                gameOptions: {
                    ...gameOptions,
                    minBuyIn: gameOptions.minBuyIn.toString(),
                    maxBuyIn: gameOptions.maxBuyIn.toString(),
                    smallBlind: gameOptions.smallBlind.toString(),
                    bigBlind: gameOptions.bigBlind.toString()
                },
                blockHeight: height,
                timestamp: new Date().toISOString()
            };

            // In production, this metadata would be stored in Cosmos SDK state
            console.log("Game creation metadata:", JSON.stringify(metadata, null, 2));
        } catch (error) {
            console.error("Error logging game creation:", error);
        }
    }

    /**
     * Get games by owner (utility method)
     */
    public async getGamesByOwner(owner: string): Promise<IGameStateDocument[]> {
        // In production, this would query the Cosmos SDK state
        // For now, we'll return all games (filtering would require additional metadata)
        return this.getAll();
    }

    /**
     * Get active games (utility method)
     */
    public async getActiveGames(): Promise<IGameStateDocument[]> {
        const allGames = await this.getAll();

        // Filter for active games based on game state
        return allGames.filter(game => {
            const state = game.state as TexasHoldemGameState;
            return state && state.players && state.players.length > 0;
        });
    }

    /**
     * Delete a game (for testing/admin purposes)
     */
    public async deleteGame(address: string): Promise<boolean> {
        const deleted = this.gameStates.delete(address);
        console.log(`Deleted game ${address}: ${deleted}`);
        return deleted;
    }

    /**
     * Clear all games (for testing purposes)
     */
    public async clearAllGames(): Promise<void> {
        this.gameStates.clear();
        console.log("Cleared all game states");
    }

    /**
     * Get total number of games
     */
    public async getGameCount(): Promise<number> {
        return this.gameStates.size;
    }
}

// Singleton instance
let cosmosGameInstance: CosmosGameManagement | null = null;

export const getCosmosGameManagementInstance = (): IGameManagement => {
    if (!cosmosGameInstance) {
        cosmosGameInstance = new CosmosGameManagement();
    }
    return cosmosGameInstance;
};