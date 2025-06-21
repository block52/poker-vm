import { IClient, NonPlayerActionType, PlayerActionType } from "@bitcoinbrisbane/block52";
import chalk from "chalk";
import { IBot } from "./interfaces";
import { BaseBot } from "./BaseBot";
import Anthropic from "@anthropic-ai/sdk";

// type ActionResponse = {
//     action: string;
//     max: string;
// };

interface ApiResponse {
    action: PlayerActionType;
    max: string; // or number if you want to convert it
}

interface TextMessage {
    type: string;
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

        // Parse the response from Claude AI
        const txtResponse: TextMessage = msg?.content[0] as TextMessage;
        if (!txtResponse || !txtResponse.type || !txtResponse.text) {
            console.error(chalk.red("Invalid response from Claude AI."));
            return; // Exit if response is invalid
        }

        console.log(chalk.cyan("Claude AI response:", txtResponse.text));

        function fixMalformedJson(str: string): string {
            return str
                // Replace single quotes with double quotes
                .replace(/'/g, '"')
                // Add quotes around unquoted property names
                .replace(/(\w+):/g, '"$1":');
        }

        const jsonParsed: ApiResponse = JSON.parse(fixMalformedJson(txtResponse.text));
        let actionType: PlayerActionType = jsonParsed.action as PlayerActionType;
        const maxValue = jsonParsed.max;

        // Perform the action based on the response from Claude AI
        let response;
        try {
            response = await this.client.playerAction(this.tableAddress, actionType, maxValue);
            console.log(chalk.cyan("Action posted successfully:", response?.hash));
            return; // Exit after posting action
        } catch (error) {
            console.error(chalk.red("Failed to post action:", error));
            return; // Exit if action posting fails
        }
    }
}
