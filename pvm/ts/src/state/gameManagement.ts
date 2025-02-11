import TexasHoldemGame from "../engine/texasHoldem";
import { StateManager } from "./stateManager";
import GameState from "../schema/gameState";
import { PlayerState, TexasHoldemGameState } from "../models/game";
import { ethers } from "ethers";
import { Card } from "../models/deck";
import { TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";

export class GameManagement extends StateManager {
    // private static _game: Map<string, TexasHoldemGame> = new Map<string, TexasHoldemGame>();

    private readonly mempool: Mempool;

    constructor() {
        super(process.env.DB_URL || "mongodb://localhost:27017/pvm");
        this.mempool = getMempoolInstance();
    }

    // join(gameAddress: string, playerAddress: string) {
    //     let game = GameManagement._game.get(gameAddress);

    //     if (!game) {
    //         game = new TexasHoldemGame(gameAddress, 10, 30);
    //         GameManagement._game.set(gameAddress, game);
    //     }

    //     game.join(new Player(playerAddress, 100));
    //     console.log(`Player ${playerAddress} joining ${gameAddress}`);
    //     if (game.deal.length === 3)
    //         game.deal();
    // }

     async get(address: string): Promise<any> {

        const players: PlayerState[] = [];
        const communityCards: Card[] = [];
        
        if (address === ethers.ZeroAddress) {
            // create this as pure json object
            const json = {
                type: "cash",
                address: ethers.ZeroAddress,
                smallBlind: "10000000000000000000",
                bigBlind: "30000000000000000000",
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

        // if (address === "0x0000000000000000000000000000000000000001") {
        //     const texasHoldemGameState = await GameState.findOne({
        //         address
        //     });

        //     // if (!texasHoldemGameState) {
        //     //     throw new Error("Game not found");
        //     // }

        //     const json = texasHoldemGameState?.state.toJSON();
        //     const game = TexasHoldemGame.fromJson(json);
        //     return game;
        // }

        const gameState = await GameState.findOne({
            address
        });

        if (!gameState) {
            throw new Error("Game not found");
        }

        // Store the game state in the database as a JSON object
        const json = gameState.state.toJSON();
        return json;

        // const texasHoldemGameState: TexasHoldemGameState = TexasHoldemGameState.fromJson(json);
        // return texasHoldemGameState;
    }

    // async get(address: string): Promise<TexasHoldemGameState> {
    //     //  return GameManagement._game.get(address);

    //     const players: PlayerState[] = [];
    //     const communityCards: Card[] = [];
        
    //     if (address === ethers.ZeroAddress) {
    //         const texasHoldemGameState = new TexasHoldemGameState(
    //             ethers.ZeroAddress,
    //             0.05, // small blind
    //             0.10, // big blind
    //             0, // dealer
    //             players,
    //             communityCards,
    //             0, // pot
    //             0, // current bet
    //             TexasHoldemRound.ANTE,
    //             undefined
    //         );

    //         return texasHoldemGameState;
    //     }

    //     // if (address === "0x0000000000000000000000000000000000000001") {
    //     //     const texasHoldemGameState = await GameState.findOne({
    //     //         address
    //     //     });

    //     //     // if (!texasHoldemGameState) {
    //     //     //     throw new Error("Game not found");
    //     //     // }

    //     //     const json = texasHoldemGameState?.state.toJSON();
    //     //     const game = TexasHoldemGame.fromJson(json);
    //     //     return game;
    //     // }

    //     const gameState = await GameState.findOne({
    //         address
    //     });

    //     if (!gameState) {
    //         throw new Error("Game not found");
    //     }

    //     // Store the game state in the database as a JSON object
    //     const json = gameState.state.toJSON();
    //     const texasHoldemGameState: TexasHoldemGameState = TexasHoldemGameState.fromJson(json);
    //     return texasHoldemGameState;
    // }

    async save(gameState: TexasHoldemGameState): Promise<void> {
        const game = new GameState(gameState.toJson());
        await game.save();
    }
}

export default GameManagement;