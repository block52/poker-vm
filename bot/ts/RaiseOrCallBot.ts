import { NonPlayerActionType, PlayerActionType } from "@bitcoinbrisbane/block52";
import chalk from "chalk";
import { IBot } from "./interfaces";
import { BaseBot } from "./BaseBot";

export class RaiseOrCallBot extends BaseBot implements IBot {

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
        const canRaise = actions.some(action => action.action === PlayerActionType.RAISE);

        if (canRaise) {
            console.log(chalk.cyan("Raising..."));
            const action = actions.find(action => action.action === PlayerActionType.RAISE);
            if (action) {
                const response = await this.client.playerAction(this.tableAddress, PlayerActionType.RAISE, action.min || "0");
                console.log(chalk.cyan("Raising successfully:", response?.hash));

                return; // Skip to next iteration after check
            }
        }

        // Can call?
        const canCall = actions.some(action => action.action === PlayerActionType.CALL);
        if (canCall) {
            console.log(chalk.cyan("Calling..."));
            const amount = actions.find(action => action.action === PlayerActionType.CALL)?.min || "0";
            const response = await this.client.playerAction(this.tableAddress, PlayerActionType.CALL, amount);
            console.log(chalk.cyan("Calling successfully:", response?.hash));
            return; // Skip to next iteration after call
        }

        // Can check?
        const canCheck = actions.some(action => action.action === PlayerActionType.CHECK);

        if (canCheck) {
            const response = await this.client.playerAction(this.tableAddress, PlayerActionType.CHECK, "0");
            console.log(chalk.cyan("Checking successfully:", response?.hash));

            return; // Skip to next iteration after check
        }

        // Can show?
        const canShow = actions.some(action => action.action === PlayerActionType.SHOW);
        if (canShow) {
            console.log(chalk.cyan("Showing cards..."));
            const response = await this.client.playerAction(this.tableAddress, PlayerActionType.SHOW, "0");
            console.log(chalk.cyan("Show posted successfully:", response?.hash));
            return; // Skip to next iteration after show
        }

        console.log(chalk.yellow("No valid actions available to perform at this time."));
    }
}
