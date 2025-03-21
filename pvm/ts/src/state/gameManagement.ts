import { StateManager } from "./stateManager";
import GameState from "../schema/gameState";
import { ethers } from "ethers";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { IJSONModel } from "../models/interfaces";
import { ContractSchema } from "../models/contractSchema";
import { GameOptions } from "../engine/texasHoldem";
import crypto from "crypto";

export class GameManagement extends StateManager {
    private readonly mempool: Mempool;

    constructor() {
        super(process.env.DB_URL || "mongodb://localhost:27017/pvm");
        this.mempool = getMempoolInstance();
    }

    async get(address: string): Promise<any> {
        const gameState = await GameState.findOne({
            address
        });

        if (gameState) {
            // this is stored in MongoDB as an object / document
            const state = gameState.state;
            return state;
        }

        // Do defaults for the game contract
        const gameOptions: GameOptions = await ContractSchema.getGameOptions(address);

        if (gameOptions) {
            const json = {
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
                communityCards: [],
                pots: ["0"],
                nextToAct: -1,
                round: "preflop",
                winners: [],
                signature: ethers.ZeroHash
            };

            return json;
        }

        throw new Error("Game not found");
    }

    async deploy(nonce: bigint, owner: string, gameOptions: GameOptions): Promise<string> {
        const digest = `${owner}-${nonce}-${gameOptions.minBuyIn}-${gameOptions.maxBuyIn}-${gameOptions.minPlayers}-${gameOptions.maxPlayers}-${gameOptions.smallBlind}-${gameOptions.bigBlind}`;
        const hash = crypto.createHash("sha256").update(digest).digest("hex");

        const game = new GameState({
            address: hash,
            state: {
                type: "cash",
                address: hash,
                minBuyIn: gameOptions.minBuyIn.toString(),
                maxBuyIn: gameOptions.maxBuyIn.toString(),
                minPlayers: gameOptions.minPlayers,
                maxPlayers: gameOptions.maxPlayers,
                smallBlind: gameOptions.smallBlind.toString(),
                bigBlind: gameOptions.bigBlind.toString(),
                dealer: gameOptions.maxPlayers, // Dealer is the last player (1 based index)
                players: [],
                communityCards: [],
                pots: ["0"],
                nextToAct: -1,
                round: "preflop",
                winners: [],
                signature: ethers.ZeroHash
            }
        });

        await game.save();
        return hash;
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
