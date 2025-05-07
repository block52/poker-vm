import { GameManagement } from "../state/gameManagement";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { signResult } from "./abstractSignedCommand";
import { GameOptionsResponse } from "@bitcoinbrisbane/block52";

export class FindGameStateCommand implements ISignedCommand<GameOptionsResponse[]> {
    private readonly gameManagement: GameManagement;
    private readonly sb?: bigint;
    private readonly bb?: bigint;

    // TODO: Create more specific types for min and max
    constructor(private readonly privateKey: string, query: string) {
        this.gameManagement = new GameManagement();

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

    public async execute(): Promise<ISignedResponse<GameOptionsResponse[]>> {
        try {
            const results = [];
            const games = await this.gameManagement.getAll();

            for (const game of games) {
                const sb = game.state?.smallBlind;
                const bb = game.state?.bigBlind;

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
                    results.push({
                        address: game.address,
                        gameOptions: {
                            smallBlind: game.state?.smallBlind.toString(),
                            bigBlind: game.state?.bigBlind.toString()
                        }
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
