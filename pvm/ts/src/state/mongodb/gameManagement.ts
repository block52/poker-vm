import { StateManager } from "../stateManager";
import GameState from "../../schema/gameState";
import { ethers } from "ethers";
import { IGameStateDocument, IJSONModel } from "../../models/interfaces";
import { GameOptions, NodeRpcClient, TexasHoldemGameState, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Deck } from "../../models";
import { IGameManagement } from "../interfaces";
import { createAddress } from "../../utils/crypto";

export class GameManagement extends StateManager implements IGameManagement {
    constructor(protected readonly connString: string) {
        super(connString);
    }

    public async getByAddress(address: string): Promise<IGameStateDocument | null> {
        const gameState = await GameState.findOne({
            address
        });

        if (gameState) {
            // this is stored in MongoDB as an object / document
            const state: IGameStateDocument = {
                address: gameState.address,
                gameOptions: gameState.gameOptions,
                state: gameState.state
            };
            return state;
        }

        // Return null instead of throwing an error
        return null;
    }

    public async getAll(): Promise<IGameStateDocument[]> {
        const gameStates = await GameState.find({});
        const states = gameStates.map(gameState => {
            // this is stored in MongoDB as an object / document
            const state: IGameStateDocument = {
                address: gameState.address,
                gameOptions: gameState.gameOptions,
                state: gameState.state
            };
            return state;
        });
        return states;
    }

    public async getAllBySchemaAddress(schemaAddress: string): Promise<IGameStateDocument[]> {
        const gameStates = await GameState.find({ schemaAddress });
        const states = gameStates.map(gameState => {
            // this is stored in MongoDB as an object / document
            const state: IGameStateDocument = {
                address: gameState.address,
                gameOptions: gameState.gameOptions,
                state: gameState.state
            };
            return state;
        });
        return states;
    }

    // This needs to be looser in the future as "any", use a generic type
    public async getState(address: string): Promise<TexasHoldemGameState | null> {
        const gameState = await GameState.findOne({
            address
        });

        if (gameState) {
            // this is stored in MongoDB as an object / document
            return gameState.state;
        }

        // Return null instead of throwing an error
        return null;
    }

    public async getGameOptions(address: string): Promise<GameOptions> {
        const game = await GameState.findOne({
            address
        });

        if (!game) {
            throw new Error(`Game not found for address: ${address}`);
        }

        return game.gameOptions as GameOptions;
    }

    public async create(nonce: bigint, contractSchemaAddress: string, gameOptions: GameOptions, timestamp?: string): Promise<string> {
        // Include timestamp in digest for uniqueness if provided
        const timestampPart = timestamp ? `-${timestamp}` : "";
        const digest = `${contractSchemaAddress}-${nonce}-${gameOptions.minBuyIn}-${gameOptions.maxBuyIn}-${gameOptions.minPlayers}-${gameOptions.maxPlayers}-${gameOptions.smallBlind}-${gameOptions.bigBlind}${timestampPart}`;
        const address = createAddress(digest);

        // Creating a log to confirm what's happening
        console.log(`Creating game with digest: ${digest}`);
        console.log(`Generated address: ${address}`);
        console.log(`Timestamp used: ${timestamp || "none"}`);

        // Todo: Add deck
        const deck = new Deck();
        const seed = NodeRpcClient.generateRandomNumber();
        deck.shuffle(seed);

        const state: TexasHoldemGameState = {
            type: "cash",
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
            signature: ethers.ZeroHash
        };

        const game = new GameState({
            address: address,
            gameOptions: gameOptions,
            state
        });

        await game.save();
        return address;
    }

    public async save(state: IJSONModel): Promise<void> {
        // Update or insert the game state
        const game = new GameState(state.toJson());

        const existingGameState = await GameState.findOne({
            address: game.address
        });

        if (existingGameState) {
            existingGameState.state = game.state; // Arbitrary JSON object
            await existingGameState.save();
        } else {
            await game.save();
        }
    }

    public async saveFromJSON(json: any): Promise<void> {
        const game = new GameState({
            address: json.address,
            state: json
        });

        const existingGameState = await GameState.findOne({
            address: game.address
        });

        if (existingGameState) {
            existingGameState.state = game.state;
            await existingGameState.save();
        } else {
            await game.save();
        }
    }

    public static parseSchema(schema: string): GameOptions {

        // Example schema: "category,name,2,10,1000,2000,50000,1000000,30000"
        // Ensure the schema is a valid string via a Regular Expression
        if (!/^[^,]+,[^,]+(?:,\d+)+$/.test(schema)) {
            throw new Error("Invalid schema format");
        }

        const args = schema.split(",");
        if (args.length < 8) {
            throw new Error("Invalid schema");
        }

        const timeout = args[8] ? parseInt(args[8]) : 30000; // Default timeout of 30 seconds

        const options: GameOptions = {
            minBuyIn: BigInt(args[6]),
            maxBuyIn: BigInt(args[7]),
            minPlayers: parseInt(args[2]),
            maxPlayers: parseInt(args[3]),
            smallBlind: BigInt(args[4]),
            bigBlind: BigInt(args[5]),
            timeout: timeout
        };

        return options;
    }
}

let instance: GameManagement;
export const getGameManagementInstance = (): IGameManagement => {
    if (!instance) {
        const connString = process.env.DB_URL || "mongodb://localhost:27017/pvm";
        instance = new GameManagement(connString);
    }
    return instance;
};
