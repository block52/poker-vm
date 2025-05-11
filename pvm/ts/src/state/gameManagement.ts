import { StateManager } from "./stateManager";
import GameState from "../schema/gameState";
import { ethers } from "ethers";
import { IGameStateDocument, IJSONModel } from "../models/interfaces";
import { GameOptions, TexasHoldemGameState, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Deck } from "../models";
import { IGameManagement } from "./interfaces";

export class GameManagement extends StateManager implements IGameManagement {
    constructor() {
        super(process.env.DB_URL || "mongodb://localhost:27017/pvm");
    }

    public async getAll(): Promise<IGameStateDocument[]> {
        const gameStates = await GameState.find({});
        const states = gameStates.map(gameState => {
            // this is stored in MongoDB as an object / document
            const state: IGameStateDocument = {
                address: gameState.address,
                state: gameState.state
            };
            return state;
        });
        return states;
    }

    // This needs to be looser in the future as "any", use a generic type
    public async get(address: string): Promise<TexasHoldemGameState | null> {
        const gameState = await GameState.findOne({
            address
        });

        if (gameState) {
            // this is stored in MongoDB as an object / document
            const state = gameState.state;
            return state;
        }

        // Return null instead of throwing an error
        return null;
    }

    public async create(nonce: bigint, contractSchemaAddress: string, gameOptions: GameOptions): Promise<string> {
        // TODO: Eventually we should generate a unique table address here, but for now
        // the game address needs to be the same as the contractSchema address for the system
        // to work correctly. We're keeping the original hash generation code commented out
        // until we can properly separate game instances from contract schemas.

        // const digest = `${contractSchemaAddress}-${nonce}-${gameOptions.minBuyIn}-${gameOptions.maxBuyIn}-${gameOptions.minPlayers}-${gameOptions.maxPlayers}-${gameOptions.smallBlind}-${gameOptions.bigBlind}`;
        // const hash = crypto.createHash("sha256").update(digest).digest("hex");

        // Instead of creating a new hash, using the contractSchema address
        // This ensures the game address matches the contract address
        const address = contractSchemaAddress;

        // Creating a log to confirm what's happening
        console.log(`Creating game with address: ${address} (using contract schema address directly)`);

        // Todo: Add deck
        const deck = new Deck();
        deck.shuffle();

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
            positions: {
                dealer: gameOptions.maxPlayers,
                smallBlind: 1,
                bigBlind: 2
            },
            communityCards: [],
            pots: ["0"],
            nextToAct: -1,
            round: TexasHoldemRound.ANTE,
            winners: [],
            signature: ethers.ZeroHash
        };

        const game = new GameState({
            address: address,
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
}

let instance: GameManagement;
export const getGameManagementInstance = (): IGameManagement => {
    if (!instance) {
        instance = new GameManagement();
    }
    return instance;
};
