import { IClient, NonPlayerActionType, PlayerActionType } from "@bitcoinbrisbane/block52";
import chalk from "chalk";
import { IBot } from "./interfaces";
import { BaseBot } from "./BaseBot";
import Anthropic from "@anthropic-ai/sdk";

type ActionResponse = {
    action: string;
    max: string;
};

interface TextMessage {
  type: 'text';
  text: string;
}

export class ClaudeBot extends BaseBot implements IBot {
    get isTurn(): boolean {
        return true;
    }

    constructor(tableAddress: string, me: string, privateKey: string, private readonly apiKey: string) {
        super(tableAddress, me, privateKey);
    }

    async performAction(): Promise<void> {
        const actions = await this.getLegalActions();

        if (!actions || actions.length === 0) {
            console.log("No actions available to perform.");
            return;
        }

        console.log(chalk.cyan("Legal actions available:"));

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

        const anthropic = new Anthropic({
            apiKey: this.apiKey
        });

        const gameState = await this.client.getGameState(this.tableAddress, this.me);

        let prompt =
            "You are a poker bot. You will be given a list of legal actions you can take. Choose one of the actions and return it in the format: { action: 'ACTION_TYPE', max: 'MAX_VALUE' }.\n\nLegal Actions:\n" +
            actions.map(action => `- ${action.action} (max: ${action.max})`).join("\n");

        prompt += `\n\n You can see the current state of the game from the previous actions in this json object:\n${JSON.stringify(
            gameState.previousActions,
            null,
            2
        )}`;
        prompt += `\n\n Return only the action you want to take. Do not return any other text or explanation.`;

        const msg = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            messages: [{ role: "user", content: prompt }]
        });
        console.log(chalk.green("Claude response received:"));
        console.log(msg?.content[0]);
        // const actionResponse: ActionResponse = JSON.parse(msg?.content[0].type);



        // if (msg.content[0].te) {
        //     console.error(chalk.red("No response from Claude AI."));
        //     return; // Exit if no response is received
        // }


        // console.log(actionResponse);

        // const response = await this.client.playerAction(
        //     this.tableAddress,
        //     actionResponse.action as PlayerActionType,
        //     actionResponse.max || "0"
        // );

        // try {
        //     actionResponse = JSON.parse(msg.content);
        // } catch (error) {
        //     console.error(chalk.red("Failed to parse action response:", error));
        //     return; // Exit if parsing fails
        // }

        // // If we can deal, then deal
        // const canDeal = actions.some(action => action.action === NonPlayerActionType.DEAL);
        // if (canDeal) {
        //     console.log(chalk.cyan("Dealing cards..."));
        //     const response = await this.client.deal(this.tableAddress, "", this.me);
        //     console.log(chalk.cyan("Deal action posted successfully:", response?.hash));
        //     return; // Skip to next iteration after dealing
        // }

        // // If legal actions contain post-small-blind, we can post small blind
        // const hasPostSmallBlind = actions.some(action => action.action === PlayerActionType.SMALL_BLIND);
        // if (hasPostSmallBlind) {
        //     console.log(chalk.cyan("Posting small blind..."));
        //     const action = actions.find(action => action.action === PlayerActionType.SMALL_BLIND);
        //     if (!action) {
        //         console.error(chalk.red("No small blind action found!"));
        //         return; // Exit if no small blind action is found
        //     }
        //     const response = await this.client.playerAction(this.tableAddress, PlayerActionType.SMALL_BLIND, action.max || "1");
        //     console.log(chalk.cyan("Small blind posted successfully:", response?.hash));
        //     return; // Skip to next iteration after posting small blind
        // }

        // const hasPostBigBlind = actions.some(action => action.action === PlayerActionType.BIG_BLIND);
        // if (hasPostBigBlind) {
        //     console.log(chalk.cyan("Posting big blind..."));
        //     const action = actions.find(action => action.action === PlayerActionType.BIG_BLIND);
        //     if (!action) {
        //         console.error(chalk.red("No big blind action found!"));
        //         return; // Exit if no big blind action is found
        //     }
        //     const response = await this.client.playerAction(this.tableAddress, PlayerActionType.BIG_BLIND, action.max || "0");
        //     console.log(chalk.cyan("Big blind posted successfully:", response?.hash));
        //     return; // Skip to next iteration after posting big blind
        // }

        // // Can check?
        // const canCheck = actions.some(action => action.action === PlayerActionType.CHECK);

        // if (canCheck) {
        //     const response = await this.client.playerAction(this.tableAddress, PlayerActionType.CHECK, "0");
        //     console.log(chalk.cyan("Check posted successfully:", response?.hash));

        //     return; // Skip to next iteration after check
        // }

        // // Can call?
        // const canCall = actions.some(action => action.action === PlayerActionType.CALL);
        // if (canCall) {
        //     console.log(chalk.cyan("Calling..."));
        //     const callAction = actions.find(action => action.action === PlayerActionType.CALL);
        //     if (!callAction) {
        //         console.error(chalk.red("No call action found!"));
        //         return; // Exit if no call action is found
        //     }

        //     if (!callAction.max) {
        //         console.error(chalk.red("Call action does not have a max value!"));
        //         return; // Exit if call action does not have a max value
        //     }

        //     const response = await this.client.playerAction(this.tableAddress, PlayerActionType.CALL, callAction.max.toString());
        //     console.log(chalk.cyan("Call posted successfully:", response?.hash));
        //     return; // Skip to next iteration after call
        // }

        // // Can show?
        // const canShow = actions.some(action => action.action === PlayerActionType.SHOW);
        // if (canShow) {
        //     console.log(chalk.cyan("Showing cards..."));
        //     const response = await this.client.playerAction(this.tableAddress, PlayerActionType.SHOW, "0");
        //     console.log(chalk.cyan("Show posted successfully:", response?.hash));
        //     return; // Skip to next iteration after show
        // }

        // // // Can fold?
        // // const canFold = actions.some(action => action.action === PlayerActionType.FOLD);
        // // if (canFold) {
        // //     console.log(chalk.cyan("Folding like a nit..."));
        // //     const response = await this.client.playerAction(this.tableAddress, PlayerActionType.FOLD, "0");
        // //     console.log(chalk.cyan("Fold posted successfully:", response?.hash));

        // //     return; // Skip to next iteration after fold
        // // }

        console.log(chalk.yellow("No valid actions available to perform at this time."));
    }
}
