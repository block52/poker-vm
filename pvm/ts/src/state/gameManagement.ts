import TexasHoldemGame from "../engine/texasHoldem";
import { StateManager } from "./stateManager";
import GameState from "../schema/gameState";
import { PlayerState, TexasHoldemGameState } from "../models/game";
import { ethers } from "ethers";
import { Card } from "../models/deck";
import { TexasHoldemRound } from "@bitcoinbrisbane/block52";

export class GameManagement extends StateManager {
    // private static _game: Map<string, TexasHoldemGame> = new Map<string, TexasHoldemGame>();

    constructor() {
        super(process.env.DB_URL || "mongodb://localhost:27017/pvm");
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

    async get(address: string): Promise<TexasHoldemGameState> {
        //  return GameManagement._game.get(address);

        const players: PlayerState[] = [];
        const communityCards: Card[] = [];
        
        if (address === ethers.ZeroAddress) {
            const texasHoldemGameState = new TexasHoldemGameState(
                ethers.ZeroAddress,
                0.05, // small blind
                0.10, // big blind
                0, // dealer
                players,
                communityCards,
                0, // pot
                0, // current bet
                TexasHoldemRound.ANTE,
                undefined
            );

            return texasHoldemGameState;
        }

        const gameState = await GameState.findOne({
            address
        });

        if (!gameState) {
            throw new Error("Game not found");
        }

        // Store the game state in the database as a JSON object
        const json = gameState.state.toJSON();
        const texasHoldemGameState = TexasHoldemGameState.fromJson(json);
        return texasHoldemGameState;
    }

    async save(gameState: TexasHoldemGameState): Promise<void> {
        const game = new GameState(gameState.toJson());
        await game.save();
    }
}

export default GameManagement;