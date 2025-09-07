import { StateManager } from "../stateManager";
import GameState from "../../schema/gameState";
import { ethers } from "ethers";
import { IGameStateDocument, IJSONModel } from "../../models/interfaces";
import { GameOptions, GameOptionsDTO, GameType, NodeRpcClient, TexasHoldemGameState, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Deck } from "../../models";
import { IGameManagement } from "../interfaces";
import { createAddress } from "../../utils/crypto";

export class GameManagement extends StateManager implements IGameManagement {
    constructor(protected readonly connString: string) {
        super(connString);
    }

    private toGameStateDocument(gameState: any): IGameStateDocument {
        return {
            address: gameState.address,
            gameOptions: gameState.gameOptions,
            state: gameState.state
        };
    }

    public async getByAddress(address: string): Promise<IGameStateDocument | null> {
        const gameState = await GameState.findOne({
            address
        });

        if (!gameState) {
            // Return null instead of throwing an error
            return null;
        }

        // this is stored in MongoDB as an object / document
        const state = this.toGameStateDocument(gameState);

        // const state: IGameManagement = this.cast(gameState.address, gameState.gameOptions as GameOptions, gameState.state as TexasHoldemGameState);

        return state;
    }

    public async getAll(): Promise<IGameStateDocument[]> {
        const gameStates = await GameState.find({});
        const states = gameStates.map(gameState => {
            return this.toGameStateDocument(gameState);
        });
        return states;
    }

    public async getAllBySchemaAddress(schemaAddress: string): Promise<IGameStateDocument[]> {
        const gameStates = await GameState.find({ schemaAddress });
        const states = gameStates.map(gameState => {
            return this.toGameStateDocument(gameState);
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

        // Force string conversion for BigInt fields
        const gameOptions: GameOptions = {
            minBuyIn: BigInt(game.gameOptions.minBuyIn),
            maxBuyIn: BigInt(game.gameOptions.maxBuyIn),
            minPlayers: game.gameOptions.minPlayers,
            maxPlayers: game.gameOptions.maxPlayers,
            smallBlind: BigInt(game.gameOptions.smallBlind),
            bigBlind: BigInt(game.gameOptions.bigBlind),
            timeout: game.gameOptions.timeout,
            type: game.gameOptions.type
        }

        return gameOptions;
    }

    public async create(nonce: bigint, owner: string, gameOptions: GameOptions): Promise<string> {
        const digest = `${owner}-${nonce}-${gameOptions.minBuyIn}-${gameOptions.maxBuyIn}-${gameOptions.minPlayers}-${gameOptions.maxPlayers}-${gameOptions.smallBlind}-${gameOptions.bigBlind}`;
        const address = createAddress(digest);

        // Check if game with this address already exists
        const existingGame = await GameState.findOne({ address });
        if (existingGame) {
            throw new Error(`Game already exists with address: ${address}`);
        }

        // Todo: Add deck
        const deck = new Deck();
        const seed = NodeRpcClient.generateRandomNumber();
        deck.shuffle(seed);

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
            signature: ethers.ZeroHash
        };

        // Cast gameOptions to GameOptionsDTO, to save in mongo bigints as strings
        const gameOptionsDTO: GameOptionsDTO = {
            minBuyIn: gameOptions.minBuyIn.toString(),
            maxBuyIn: gameOptions.maxBuyIn.toString(),
            minPlayers: gameOptions.minPlayers,
            maxPlayers: gameOptions.maxPlayers,
            smallBlind: gameOptions.smallBlind.toString(),
            bigBlind: gameOptions.bigBlind.toString(),
            timeout: gameOptions.timeout,
            type: gameOptions.type
        }

        const game = new GameState({
            address: address,
            gameOptions: gameOptionsDTO,
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
        const urlSearchParams = new URLSearchParams(schema);

        const options: GameOptions = {
            minBuyIn: BigInt(urlSearchParams.get("minBuyIn") || "0"),
            maxBuyIn: BigInt(urlSearchParams.get("maxBuyIn") || "2000"),
            minPlayers: parseInt(urlSearchParams.get("minPlayers") || "2"),
            maxPlayers: parseInt(urlSearchParams.get("maxPlayers") || "6"),
            smallBlind: BigInt(urlSearchParams.get("smallBlind") || "0"),
            bigBlind: BigInt(urlSearchParams.get("bigBlind") || "0"),
            timeout: parseInt(urlSearchParams.get("timeout") || "30000"),
            type: urlSearchParams.get("type") as GameType
        };

        return options;
    }
}

let instance: GameManagement;
export const getGameManagementInstance = (): IGameManagement => {
    if (!instance) {
        const connString = process.env.DB_URL;
        if (!connString) {
            throw new Error("No database connection string provided. Please set the DB_URL environment variable.");
        }
        instance = new GameManagement(connString!);
    }
    return instance;
};
