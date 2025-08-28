import { IClient, LegalActionDTO, NodeRpcClient, NonPlayerActionType, PlayerActionType, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
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

    async standardActions(actions: LegalActionDTO[]): Promise<boolean> {

        if (!actions || actions.length === 0) {
            console.log("No actions available to perform.");
            return false;
        }

        // If we can deal, then deal
        const canDeal = actions.some(action => action.action === NonPlayerActionType.DEAL);
        if (canDeal) {
            console.log(chalk.cyan("Dealing cards..."));
            const response = await this.client.deal(this.tableAddress, "", this.me);
            console.log(chalk.cyan("Deal action posted successfully:", response?.hash));
            return true; // Skip to next iteration after dealing
        }

        const canShow = actions.some(action => action.action === PlayerActionType.SHOW);
        if (canShow) {
            console.log(chalk.cyan("Showing cards..."));
            const action = actions.find(action => action.action === PlayerActionType.SHOW);
            if (!action) {
                console.error(chalk.red("No show action found!"));
                return false; // Exit if no show action is found
            }
            const response = await this.client.playerAction(this.tableAddress, PlayerActionType.SHOW, "0");
            console.log(chalk.cyan("Show action posted successfully:", response?.hash));
            return true; // Skip to next iteration after showing cards
        }

        const canStartNewHand = actions.some(action => action.action === NonPlayerActionType.NEW_HAND);
        if (canStartNewHand) {
            console.log(chalk.cyan("Starting a new hand..."));
            const response = await this.client.newHand(this.tableAddress);
            console.log(chalk.cyan("New hand action posted successfully:", response?.hash));
            return true; // Skip to next iteration after starting a new hand
        }

        // If legal actions contain post-small-blind, we can post small blind
        const hasPostSmallBlind = actions.some(action => action.action === PlayerActionType.SMALL_BLIND);
        if (hasPostSmallBlind) {
            console.log(chalk.cyan("Posting small blind..."));
            const action = actions.find(action => action.action === PlayerActionType.SMALL_BLIND);
            if (!action) {
                console.error(chalk.red("No small blind action found!"));
                return false; // Exit if no small blind action is found
            }
            const response = await this.client.playerAction(this.tableAddress, PlayerActionType.SMALL_BLIND, action.max || "1");
            console.log(chalk.cyan("Small blind posted successfully:", response?.hash));
            return true; // Skip to next iteration after posting small blind
        }

        const hasPostBigBlind = actions.some(action => action.action === PlayerActionType.BIG_BLIND);
        if (hasPostBigBlind) {
            console.log(chalk.cyan("Posting big blind..."));
            const action = actions.find(action => action.action === PlayerActionType.BIG_BLIND);
            if (!action) {
                console.error(chalk.red("No big blind action found!"));
                return false; // Exit if no big blind action is found
            }
            const response = await this.client.playerAction(this.tableAddress, PlayerActionType.BIG_BLIND, action.max || "0");
            console.log(chalk.cyan("Big blind posted successfully:", response?.hash));
            return true; // Skip to next iteration after posting big blind
        }

        return false;
    }

    async hasJoined(): Promise<boolean> {
        try {
            console.log(chalk.cyan("\nDebug - hasJoined:"));
            console.log(chalk.cyan("Table address:"), this.tableAddress);
            const gameState = await this.getGameState();
            console.log(chalk.cyan("Game state fetched successfully."));
            const myPlayer = gameState.players.find(p => p.address === this.me);
            if (myPlayer) {
                console.log(chalk.green("You are already seated at this table!"));
                return true;
            }
            console.log(chalk.yellow("You have not joined the game yet."));
            return false;
        }
        catch (error: any) {
            console.error(chalk.red("Failed to check if joined game:"), error.message);
            console.error(chalk.red("Error stack:"), error.stack);
            return false;
        }
    }

    // Modify the joinGame function to use these helpers
    async joinGame(): Promise<boolean> {
        try {
            // Check if already joined
            const alreadyJoined = await this.hasJoined();
            if (alreadyJoined) {
                return true;
            }

            console.log(chalk.cyan("\nDebug - joinGame:"));
            console.log(chalk.cyan("Table address:"), this.tableAddress);

            const gameState = await this.getGameState();
            let seats = [1, 2, 3, 4, 5, 6, 7, 8, 9];

            // Reduce players.seats to an array of available seats
            const occupiedSeats = gameState.players
                .filter(p => p.seat !== undefined)
                .map(p => p.seat)
                .filter(seat => seat !== undefined);

            // Filter out occupied seats
            seats = seats.filter(seat => !occupiedSeats.includes(seat));

            // Table stakes
            // const defaultBuyIn = BigInt("1000000000000000000"); // BigInt(gameState.gameOptions.minBuyIn || "1000000000000000000"); // minimum buy-in
            const defaultBuyIn = gameState.gameOptions.minBuyIn || "1000000000000000000"; // minimum buy-in

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