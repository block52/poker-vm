import { IClient, LegalActionDTO, NodeRpcClient, NonPlayerActionType, PlayerActionType, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { ethers, Wallet } from "ethers";
import chalk from "chalk";
import dotenv from "dotenv";
import { IBot } from "./interfaces";
import { CheckBot } from "./CheckBot";

dotenv.config();

const TABLE_ADDRESS = "0x8d488a55da78ce7646c1a1b69f6bf7924c50ad5b";
const NODE_URL = process.env.NODE_URL || "http://localhost:3000"; // "https://node1.block52.xyz";

// Add nonce tracking
let nonce: number = 0;
let play = true;

const bots: IBot[] = [];

// Remove the global pk variable since we'll use the selected key
let selectedPrivateKey: string = process.env.PRIVATE_KEY || "";
if (!selectedPrivateKey) {
    console.error(chalk.red("No private key provided. Please set the PRIVATE_KEY environment variable."));
    process.exit(1);
}

// Modify the main loop to include small blind posting
async function main() {
    const bot = new CheckBot(TABLE_ADDRESS, NODE_URL, selectedPrivateKey);
    await bot.joinGame();

    // Continuous monitoring loop
    console.log(chalk.yellow("\nStarting continuous monitoring (checking every 10 seconds)..."));
    while (play) {
        console.log(chalk.cyan("\n=== Checking game state ==="));
        console.log(chalk.cyan("Time: " + new Date().toLocaleTimeString()));

        try {

            await bot.performAction();

        } catch (error) {
            console.error(chalk.red("Error in main loop:"), error);
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 4000));
    }
}

main().catch(error => {
    console.error(chalk.red("Fatal error:"), error);
    process.exit(1);
});
