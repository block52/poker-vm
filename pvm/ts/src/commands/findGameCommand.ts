import { getGameManagementInstance } from "../state/index";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { signResult } from "./abstractSignedCommand";
import { GameOptions, GameOptionsDTO, GameOptionsResponse } from "@bitcoinbrisbane/block52";
import { IGameManagement } from "../state/interfaces";

export class FindGameStateCommand implements ISignedCommand<GameOptionsResponse[]> {
    private readonly gameManagement: IGameManagement;
    private readonly sb?: bigint;
    private readonly bb?: bigint;

    // TODO: Create more specific types for min and max
    constructor(private readonly privateKey: string, query: string) {
        this.gameManagement = getGameManagementInstance();

        if (query) {
            const params = query.split(",");

            // Parse min and max from the query string
            // Example query: "min=100,max=1000"
            // Hack for now
            for (const param of params) {
                const [key, value] = param.split("=");
                if (key === "sb") {
                    this.sb = BigInt(value);
                }
                if (key === "bb") {
                    this.bb = BigInt(value);
                }
            }
        }
    }

    public async execute(): Promise<ISignedResponse<GameOptionsResponse[]>> {
        try {
            const results: GameOptionsResponse[] = [];
            const games = await this.gameManagement.getAll();

            if (!this.sb && !this.bb) {
                for (const game of games) {

                    const gameOptions: GameOptionsDTO = {
                        minBuyIn: game.gameOptions.minBuyIn?.toString(),
                        maxBuyIn: game.gameOptions.maxBuyIn?.toString(),
                        minPlayers: game.gameOptions.minPlayers,
                        maxPlayers: game.gameOptions.maxPlayers,
                        smallBlind: game.state?.smallBlind?.toString() || "0",
                        bigBlind: game.state?.bigBlind?.toString() || "1000000000000000000000000",
                        timeout: game.gameOptions.timeout
                    };

                    const result: GameOptionsResponse = {
                        address: game.address,
                        gameOptions: gameOptions
                    };

                    results.push(result);
                }

                return await signResult(results, this.privateKey);
            }

            for (const game of games) {
                const sb = game.state?.smallBlind || 0n; // Default to 0n if undefined
                const bb = game.state?.bigBlind || 1000000000000000000000000n; // Default to 1000n if undefined

                // Initialize shouldInclude to true - default to including the game
                let shouldInclude = true;

                // Check sb only if it's defined (not null or undefined)
                if (this.sb !== undefined && this.sb !== null) {
                    shouldInclude = shouldInclude && sb >= this.sb;
                }

                // Check bb only if it's defined (not null or undefined)
                if (this.bb !== undefined && this.bb !== null) {
                    shouldInclude = shouldInclude && bb <= this.bb;
                }

                // Add to results if it passes all defined filters
                if (shouldInclude) {

                    const gameOptions: GameOptionsDTO = {
                        minBuyIn: game.gameOptions.minBuyIn?.toString(),
                        maxBuyIn: game.gameOptions.maxBuyIn?.toString(),
                        minPlayers: game.gameOptions.minPlayers,
                        maxPlayers: game.gameOptions.maxPlayers,
                        smallBlind: sb.toString(),
                        bigBlind: bb.toString(),
                        timeout: game.gameOptions.timeout
                    };

                    results.push({
                        address: game.address,
                        gameOptions: gameOptions
                    });
                }
            }

            // Return the filtered results
            return await signResult(results, this.privateKey);
        } catch (error) {
            console.error(`Error executing GameStateCommand: ${(error as Error).message}`);
            throw error; // Rethrow the error to be handled by the caller
        }
    }
}
