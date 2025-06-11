import { IClient, LegalActionDTO, NodeRpcClient, PlayerActionType, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import chalk from "chalk";
import { ethers, Wallet } from "ethers";

export abstract class BaseBot {
    readonly client: IClient;
    readonly me: string;

    public isPlaying: boolean = false;

    constructor(readonly tableAddress: string, private nodeUrl: string, private privateKey: string) {
        this.client = new NodeRpcClient(nodeUrl, privateKey);
        const wallet = new Wallet(privateKey);
        this.me = wallet.address;

        console.log(chalk.cyan(`\nBot initialized for table: ${this.tableAddress}`));
        console.log(chalk.cyan(`Bot address: ${this.me}`));
        console.log(chalk.cyan(`Node URL: ${this.nodeUrl}`));
    }

    protected async getGameState(): Promise<TexasHoldemStateDTO> {
        try {
            const dto = await this.client.getGameState(this.tableAddress, ethers.ZeroAddress);
            return dto;
        }
        catch (error) {
            throw new Error(`Failed to fetch game state: ${error}`);
        }
    };

    protected async getLegalActions(): Promise<LegalActionDTO[]> {
        console.log(chalk.yellow(`\n Getting legal actions for ${this.me}...`));
        try {
            const actions = await this.client.getLegalActions(this.tableAddress, this.me);
            return actions;
        } catch (error) {
            throw new Error(`Failed to fetch legal actions: ${error}`);
        }
    }

    // Modify the joinGame function to use these helpers
    async joinGame(): Promise<boolean> {
        try {
            console.log(chalk.cyan("\nDebug - joinGame:"));
            console.log(chalk.cyan("Table address:"), this.tableAddress);

            const gameState = await this.getGameState();
            const myPlayer = gameState.players.find(p => p.address === this.me);

            if (myPlayer) {
                console.log(chalk.green("You are already seated at this table!"));
                // console.log(chalk.cyan("Your stack:"), formatChips(myPlayer.stack));
                return true;
            }

            let seats = [1, 2, 3, 4, 5, 6, 7, 8, 9];

            // Reduce players.seats to an array of available seats
            const occupiedSeats = gameState.players
                .filter(p => p.seat !== undefined)
                .map(p => p.seat)
                .filter(seat => seat !== undefined);

            // Filter out occupied seats
            seats = seats.filter(seat => !occupiedSeats.includes(seat));

            // Table stakes
            const defaultBuyIn = BigInt("1000000000000000000"); // BigInt(gameState.gameOptions.minBuyIn || "1000000000000000000"); // minimum buy-in

            const result = await this.client.playerJoin(this.tableAddress, defaultBuyIn, seats[0]);
            console.log(chalk.cyan("Join result:", result));
            if (!result || !result.hash) {
                console.error(chalk.red("Failed to join game: No transaction hash returned."));
                return false;
            }
            this.isPlaying = true;
            console.log(chalk.green("Successfully joined game!"), chalk.cyan("Transaction hash:"), result.hash);
            return true;
        } catch (error: any) {
            console.error(chalk.red("Failed to join game:"), error.message);
            console.error(chalk.red("Error stack:"), error.stack);
            return false;
        }
    }
}