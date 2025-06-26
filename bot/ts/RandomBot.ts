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

        const baseAction = await super.standardActions(actions);
        if (baseAction) {
            console.log(chalk.cyan("Performing base action:", baseAction));
            return; // Skip to next iteration after base action
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
