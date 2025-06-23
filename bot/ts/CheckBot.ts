import { NonPlayerActionType, PlayerActionType } from "@bitcoinbrisbane/block52";
import chalk from "chalk";
import { IBot } from "./interfaces";
import { BaseBot } from "./BaseBot";

export class CheckBot extends BaseBot implements IBot {
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

        // Can check?
        const canCheck = actions.some(action => action.action === PlayerActionType.CHECK);

        if (canCheck) {
            const response = await this.client.playerAction(this.tableAddress, PlayerActionType.CHECK, "0");
            console.log(chalk.cyan("Check posted successfully:", response?.hash));

            return; // Skip to next iteration after check
        }

        // Can call?
        const canCall = actions.some(action => action.action === PlayerActionType.CALL);
        if (canCall) {
            console.log(chalk.cyan("Calling..."));
            const callAction = actions.find(action => action.action === PlayerActionType.CALL);
            if (!callAction) {
                console.error(chalk.red("No call action found!"));
                return; // Exit if no call action is found
            }

            if (!callAction.max) {
                console.error(chalk.red("Call action does not have a max value!"));
                return; // Exit if call action does not have a max value
            }

            const response = await this.client.playerAction(this.tableAddress, PlayerActionType.CALL, callAction.max.toString());
            console.log(chalk.cyan("Call posted successfully:", response?.hash));
            return; // Skip to next iteration after call
        }

        // Can show?
        const canShow = actions.some(action => action.action === PlayerActionType.SHOW);
        if (canShow) {
            console.log(chalk.cyan("Showing cards..."));
            const response = await this.client.playerAction(this.tableAddress, PlayerActionType.SHOW, "0");
            console.log(chalk.cyan("Show posted successfully:", response?.hash));
            return; // Skip to next iteration after show
        }

        // // Can fold?
        // const canFold = actions.some(action => action.action === PlayerActionType.FOLD);
        // if (canFold) {
        //     console.log(chalk.cyan("Folding like a nit..."));
        //     const response = await this.client.playerAction(this.tableAddress, PlayerActionType.FOLD, "0");
        //     console.log(chalk.cyan("Fold posted successfully:", response?.hash));

        //     return; // Skip to next iteration after fold
        // }

        console.log(chalk.yellow("No valid actions available to perform at this time."));
    }
}
