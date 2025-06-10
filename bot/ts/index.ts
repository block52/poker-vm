import chalk from "chalk";
import dotenv from "dotenv";
import { IBot } from "./interfaces";
import { CheckBot } from "./CheckBot";

dotenv.config();

let TABLE_ADDRESS = "0x328cdfcb61c7eb67e712fcf1b9fb93999a0d26a8";
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

    // Check args for table address
    if (process.argv.length > 2) {
        TABLE_ADDRESS = process.argv[1];
    }

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
        await new Promise(resolve => setTimeout(resolve, 8000));
    }
}

main().catch(error => {
    console.error(chalk.red("Fatal error:"), error);
    process.exit(1);
});
