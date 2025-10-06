import { TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "../../engine/texasHoldem";
import { signResult } from "../abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "../interfaces";
import axios from "axios";

export class GameStateCommand implements ISignedCommand<TexasHoldemStateDTO> {

    // This will be shared secret later
    constructor(readonly address: string, private readonly cosmosUrl: string) {

    }

    public async execute(): Promise<TexasHoldemStateDTO> {
        try {
            const gameState = await axios.get(`${this.cosmosUrl}/poker/game/${this.address}`);

            if (!gameState) {
                throw new Error(`Game state not found for address: ${this.address}`);
            }

            const game = TexasHoldemGame.fromJson(gameState.data.state, gameState.data.gameOptions);

            return await signResult(game.toJson(this.caller), this.privateKey);
        } catch (error) {
            console.error(`Error executing GameStateCommand: ${(error as Error).message}`);
            throw error; // Rethrow the error to be handled by the caller
        }
    }
}
