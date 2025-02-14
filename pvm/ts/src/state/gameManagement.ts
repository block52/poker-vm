import TexasHoldemGame from "../engine/texasHoldem";
import { StateManager } from "./stateManager";
import GameState from "../schema/gameState";
import { PlayerState, TexasHoldemGameState } from "../models/game";
import { ethers } from "ethers";
import { Card } from "../models/deck";
import { TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { IJSONModel } from "../models/interfaces";
import contractSchemas from "../schema/contractSchemas";

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
            // TODO: import from the the data folder
            const json = {
                type: "cash",
                address: ethers.ZeroAddress,
                smallBlind: "10000000000000000000",
                bigBlind: "30000000000000000000",
                dealer: 0,
                players,
                communityCards,
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
            const json = gameState.state.toJSON();
            return json;
        }

        const schema = await contractSchemas.findOne({ address: address });

        if (schema) {
            const args = schema.schema.split(",");
            // const game = new TexasHoldemGame(args);

            const players: PlayerState[] = [];

            const json = {
                type: args[1],
                address: address,
                minBuyIn: 0n,
                maxBuyIn: 0n,
                minPlayers: args[2],
                maxPlayers: args[3],
                smallBlind: args[4],
                bigBlind: args[5],
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
        
        throw new Error("Game not found");
    }

    async save(gameState: IJSONModel): Promise<void> {
        const game = new GameState(gameState.toJson());
        await game.save();
    }
}

export default GameManagement;
