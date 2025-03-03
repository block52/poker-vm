import { StateManager } from "./stateManager";
import GameState from "../schema/gameState";
import { ethers } from "ethers";
import { Card } from "../models/deck";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { IJSONModel } from "../models/interfaces";
import contractSchemas from "../schema/contractSchemas";
import { PlayerState } from "../engine/types";

export class GameManagement extends StateManager {
    // private static _game: Map<string, TexasHoldemGame> = new Map<string, TexasHoldemGame>();
    private readonly mempool: Mempool;

    constructor() {
        super(process.env.DB_URL || "mongodb://localhost:27017/pvm");
        this.mempool = getMempoolInstance();
    }

    async get(address: string): Promise<any> {
        const players: PlayerState[] = [];
        const communityCards: Card[] = [];

        if (address === ethers.ZeroAddress) {
            const json = {
                type: "cash",
                address: ethers.ZeroAddress,
                minBuyIn: "150000000000000000000",  // 1500 * bigBlind
                maxBuyIn: "6000000000000000000000",  // 6000 * bigBlind
                minPlayers: 2,
                maxPlayers: 9,
                smallBlind: "100000000000000000",    
                bigBlind: "200000000000000000",    
                dealer: 0,
                players: [],
                communityCards: [],
                pots: ["0"],
                nextToAct: 0,
                round: "preflop",
                winners: [],
                signature: ethers.ZeroHash
            };
            return json;
        }

        const gameState = await GameState.findOne({
            address
        });

        if (gameState) {
            // this is stored in MongoDB as an object / document
            const state = gameState.state;
            return state;
        }

        const schema = await contractSchemas.findOne({ address: address });

        if (schema) {
            const args = schema.schema.split(",");

            const smallBlind: bigint = BigInt(args[4]);
            const bigBlind: bigint = BigInt(args[5]);

            const minBuyIn: bigint = bigBlind * 50n;
            const maxBuyIn: bigint = bigBlind * 200n;

            const json = {
                type: args[1],
                address: address,
                minBuyIn: minBuyIn.toString(),
                maxBuyIn: maxBuyIn.toString(),
                minPlayers: args[2],
                maxPlayers: args[3],
                smallBlind: smallBlind.toString(),
                bigBlind: bigBlind.toString(),
                dealer: 9,
                players: [],
                communityCards: [],
                pots: ["0"],
                nextToAct: 0,
                round: "preflop",
                winners: [],
                signature: ethers.ZeroHash
            };

            return json;
        }

        throw new Error("Game not found");
    }

    async save(state: IJSONModel): Promise<void> {
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
        };
    }

    async saveFromJSON(json: any): Promise<void> {
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
        };
    };
}

let instance: GameManagement;
export const getGameManagementInstance = (): GameManagement => {
    if (!instance) {
        instance = new GameManagement();
    }
    return instance;
}
