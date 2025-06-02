import { getContractSchemaManagementInstance, getGameManagementInstance } from "../state/index";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { signResult } from "./abstractSignedCommand";
import { GameOptions, GameOptionsResponse } from "@bitcoinbrisbane/block52";
import { IContractSchemaManagement, IGameManagement } from "../state/interfaces";

export class FindGameStateCommand implements ISignedCommand<GameOptionsResponse[]> {
    private readonly gameManagement: IGameManagement;
    private readonly contractSchemaManagement: IContractSchemaManagement;
    private readonly sb?: bigint;
    private readonly bb?: bigint;

    // TODO: Create more specific types for min and max
    constructor(private readonly privateKey: string, query: string) {
        this.gameManagement = getGameManagementInstance();
        this.contractSchemaManagement = getContractSchemaManagementInstance();

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
            const results = [];
            const games = await this.gameManagement.getAll();

            if (!this.sb && !this.bb) {
                // If no filters are applied, return all games
                const results: GameOptionsResponse[] = [];
                for (const game of games) {

                    const gameOptions: GameOptions = await this.contractSchemaManagement.getGameOptions(game.address);

                    const result: GameOptionsResponse = {
                        address: game.address,
                        gameOptions: {
                            smallBlind: gameOptions?.smallBlind.toString(),
                            bigBlind: gameOptions?.bigBlind.toString(),
                            minBuyIn: gameOptions?.minBuyIn.toString(),
                            maxBuyIn: gameOptions?.maxBuyIn.toString(),
                            minPlayers: gameOptions?.minPlayers,
                            maxPlayers: gameOptions?.maxPlayers,
                            timeout: gameOptions?.timeout
                        }
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
