import { TexasHoldemStateDTO } from "@block52/poker-vm-sdk";
import TexasHoldemGame from "../../engine/texasHoldem";
import axios from "axios";

// Should never need this, should be pushed, not pulled
export class GameStateCommand {

    // This will be shared secret later
    constructor(readonly address: string, readonly caller: string, private readonly cosmosUrl: string) {

    }

    public async execute(): Promise<TexasHoldemStateDTO> {
        try {
            const response = await axios.get(`${this.cosmosUrl}/block52/pokerchain/poker/v1/game_state/${this.address}`);

            if (!response || !response.data || !response.data.game_state) {
                throw new Error(`Game state not found for address: ${this.address}`);
            }

            // Parse the JSON string from Cosmos response
            const gameStateJson = JSON.parse(response.data.game_state);

            // The Cosmos response has gameOptions as a property of the state object
            const game = TexasHoldemGame.fromJson(gameStateJson, gameStateJson.gameOptions);

            return game.toJson(this.caller);
        } catch (error) {
            // Type guard for HTTP errors with response
            type HttpError = { response?: { data?: { message?: string }, status?: number }, status?: number };
            const httpError = error as HttpError;

            // Only log the error message, not the full error object
            const errorMessage = httpError?.response?.data?.message ||
                               (error as Error).message ||
                               String(error);

            // Don't log stack trace for 404s (game not found is normal)
            if (httpError?.response?.status === 404 || httpError?.status === 404) {
                // Silent for 404s - handled gracefully by caller
            } else {
                console.error(`Error executing GameStateCommand: ${errorMessage}`);
            }

            throw error; // Rethrow the error to be handled by the caller
        }
    }
}
