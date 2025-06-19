import { NonPlayerActionType, PlayerActionType } from "@bitcoinbrisbane/block52";
import chalk from "chalk";
import { IBot } from "./interfaces";
import { BaseBot } from "./BaseBot";

export class RandomBot extends BaseBot implements IBot {
    get isTurn(): boolean {
        return true;
    }

    constructor(tableAddress: string, me: string, client: any) {
        super(tableAddress, me, client);
    }

    async performAction(): Promise<void> {
        const actions = await this.getLegalActions();

        if (!actions || actions.length === 0) {
            console.log("No actions available to perform.");
            return;
        }

        // If we can deal, then deal
        const canDeal = actions.some(action => action.action === NonPlayerActionType.DEAL);
        if (canDeal) {
            console.log(chalk.cyan("Dealing cards..."));
            const response = await this.client.deal(this.tableAddress, "", this.me);
            console.log(chalk.cyan("Deal action posted successfully:", response?.hash));
            return; // Skip to next iteration after dealing
        }

        // If legal actions contain post-small-blind, we can post small blind
        const hasPostSmallBlind = actions.some(action => action.action === PlayerActionType.SMALL_BLIND);
        if (hasPostSmallBlind) {
            console.log(chalk.cyan("Posting small blind..."));
            const action = actions.find(action => action.action === PlayerActionType.SMALL_BLIND);
            if (!action) {
                console.error(chalk.red("No small blind action found!"));
                return; // Exit if no small blind action is found
            }
            const response = await this.client.playerAction(this.tableAddress, PlayerActionType.SMALL_BLIND, action.max || "1");
            console.log(chalk.cyan("Small blind posted successfully:", response?.hash));
            return; // Skip to next iteration after posting small blind
        }

        const hasPostBigBlind = actions.some(action => action.action === PlayerActionType.BIG_BLIND);
        if (hasPostBigBlind) {
            console.log(chalk.cyan("Posting big blind..."));
            const action = actions.find(action => action.action === PlayerActionType.BIG_BLIND);
            if (!action) {
                console.error(chalk.red("No big blind action found!"));
                return; // Exit if no big blind action is found
            }
            const response = await this.client.playerAction(this.tableAddress, PlayerActionType.BIG_BLIND, action.max || "0");
            console.log(chalk.cyan("Big blind posted successfully:", response?.hash));
            return; // Skip to next iteration after posting big blind
        }

        // Filter out actions that are not blind actions
        const otherActions = actions.filter(action => action.action !== PlayerActionType.SMALL_BLIND && action.action !== PlayerActionType.BIG_BLIND);

        if (otherActions.length === 0) {
            console.log(chalk.yellow("No valid actions available to perform at this time."));
            return; // Exit if no other actions are available
        }

        const randomIndex = Math.floor(Math.random() * otherActions.length);
        const randomAction = otherActions[randomIndex];

        const response = await this.client.playerAction(this.tableAddress, randomAction.action as PlayerActionType, randomAction.min || "0");
        console.log(chalk.cyan("Check posted successfully:", response?.hash));

        return; // Skip to next iteration after check
    }
}
