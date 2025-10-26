import { TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "../../engine/texasHoldem";
import axios from "axios";

export class GameStateCommand {

    // This will be shared secret later
    constructor(readonly address: string, readonly caller: string, private readonly cosmosUrl: string) {

    }

    public async execute(): Promise<TexasHoldemStateDTO> {
        try {
            const gameState = await axios.get(`${this.cosmosUrl}/block52/pokerchain/poker/v1/game_state/${this.address}`);

            if (!gameState) {
                // If game state does not exist, call 


                throw new Error(`Game state not found for address: ${this.address}`);
            }

            const game = TexasHoldemGame.fromJson(gameState.data.state, gameState.data.gameOptions);

            return game.toJson(this.caller);
        } catch (error) {
            console.error(`Error executing GameStateCommand: ${(error as Error).message}`);
            throw error; // Rethrow the error to be handled by the caller
        }
    }
}
