import { GameManagement } from "../state/gameManagement";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { signResult } from "./abstractSignedCommand";
import { GameOptionsResponse } from "../types";

export class FindGameStateCommand implements ISignedCommand<GameOptionsResponse[]> {
    private readonly gameManagement: GameManagement;
    private readonly min?: bigint;
    private readonly max?: bigint;

    // TODO: Create more specific types for min and max
    constructor(private readonly privateKey: string, query: string) {
        this.gameManagement = new GameManagement();

        const params = query.split(",");

        // Parse min and max from the query string
        // Example query: "min=100,max=1000"
        // Hack for now
        for (const param of params) {
            const [key, value] = param.split("=");
            if (key === "minBuyIn") {
                this.min = BigInt(value);
            } 
            if (key === "maxBuyIn") {
                this.max = BigInt(value);
            }
        }
    }

    public async execute(): Promise<ISignedResponse<GameOptionsResponse[]>> {
        try {
            const results = [];
            const games = await this.gameManagement.getAll();

            for (const game of games) {
                const gameOptions = game.state.gameOptions;

                // Initialize shouldInclude to true - default to including the game
                let shouldInclude = true;

                // Check min only if it's defined (not null or undefined)
                if (this.min !== undefined && this.min !== null) {
                    shouldInclude = shouldInclude && gameOptions.minBuyIn >= this.min;
                }

                // Check max only if it's defined (not null or undefined)
                if (this.max !== undefined && this.max !== null) {
                    shouldInclude = shouldInclude && gameOptions.maxBuyIn <= this.max;
                }

                // Add to results if it passes all defined filters
                if (shouldInclude) {
                    results.push({
                        address: game.address,
                        gameOptions: game.state.gameOptions
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
