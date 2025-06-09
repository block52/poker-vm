import { IClient, LegalActionDTO, PlayerActionType } from "@bitcoinbrisbane/block52";
import chalk from "chalk";
import { IBot } from "./interfaces";

export class CheckBot implements IBot {
    constructor(readonly client: IClient, readonly me: string, readonly tableAddress: string, readonly actions: LegalActionDTO[]) {
        this.client = client;
        this.me = me;
        this.tableAddress = tableAddress;
        this.actions = actions;
    }

    async join(seat: number): Promise<string> {
        try {
            const response = await this.client.playerJoin(this.tableAddress, BigInt("10000000000000"), seat);
            console.log(chalk.cyan("- Join response:", response));
            return response.hash;
        } catch (error: any) {
            console.error(chalk.red("Failed to join game:"), error.message);
            console.error(chalk.red("Error stack:"), error.stack);
            return "Failed to join game";
        }
    }

    async performAction(): Promise<void> {
        if (!this.actions || this.actions.length === 0) {
            console.log("No actions available to perform.");
            return;
        }

        // Can check?
        const canCheck = this.actions.some(action => action.action === PlayerActionType.CHECK);

        if (canCheck) {
            const response = await this.client.playerAction(this.tableAddress, PlayerActionType.CHECK, "0");
            console.log(chalk.cyan("Check posted successfully:", response?.hash));

            return; // Skip to next iteration after check
        }

        // Can fold?
        const canFold = this.actions.some(action => action.action === PlayerActionType.FOLD);
        if (canFold) {
            console.log(chalk.cyan("Folding like a nit..."));
            const response = await this.client.playerAction(this.tableAddress, PlayerActionType.FOLD, "0");
            console.log(chalk.cyan("Fold posted successfully:", response?.hash));

            return; // Skip to next iteration after fold
        }
    }
}
