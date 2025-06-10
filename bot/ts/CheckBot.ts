import { PlayerActionType } from "@bitcoinbrisbane/block52";
import chalk from "chalk";
import { IBot } from "./interfaces";
import { BaseBot } from "./BaseBot";

export class CheckBot extends BaseBot implements IBot {
    async performAction(): Promise<void> {

        const actions = await this.getLegalActions();

        if (!actions || actions.length === 0) {
            console.log("No actions available to perform.");
            return;
        }

        // Can check?
        const canCheck = actions.some(action => action.action === PlayerActionType.CHECK);

        if (canCheck) {
            const response = await this.client.playerAction(this.tableAddress, PlayerActionType.CHECK, "0");
            console.log(chalk.cyan("Check posted successfully:", response?.hash));

            return; // Skip to next iteration after check
        }

        // Can fold?
        const canFold = actions.some(action => action.action === PlayerActionType.FOLD);
        if (canFold) {
            console.log(chalk.cyan("Folding like a nit..."));
            const response = await this.client.playerAction(this.tableAddress, PlayerActionType.FOLD, "0");
            console.log(chalk.cyan("Fold posted successfully:", response?.hash));

            return; // Skip to next iteration after fold
        }
    }
}
