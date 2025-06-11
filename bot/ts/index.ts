import chalk from "chalk";
import dotenv from "dotenv";
import { IBot } from "./interfaces";
import { CheckBot } from "./CheckBot";
import { connectDB } from "./mongoConnection";
import Bots from "./schema/bots";
import { ethers } from "ethers";

dotenv.config();

let TABLE_ADDRESS = "0x6d44ea6a1ec96b0ed83049e1f6dcbf3b5620b6e2";
const NODE_URL = process.env.NODE_URL || "http://localhost:3000"; // "https://node1.block52.xyz";

// Add nonce tracking
let play = true;
const _bots: IBot[] = [];
const botAddresses: string[] = [];

// Remove the global pk variable since we'll use the selected key
let selectedPrivateKey: string = process.env.PRIVATE_KEY || "";
if (!selectedPrivateKey) {
    console.error(chalk.red("No private key provided. Please set the PRIVATE_KEY environment variable."));
    process.exit(1);
}

// Modify the main loop to include small blind posting
async function main() {
    const connectionString = process.env.DB_URL || "mongodb://localhost:27017/pvm";
    await connectDB.connect(connectionString);

    // Check args for table address
    if (process.argv.length > 2) {
        TABLE_ADDRESS = process.argv[1];
    }

    const bots = await Bots.find({ enabled: true });

    if (bots.length === 0) {
        console.error(chalk.red("No enabled bots found in the database."));
        console.error(chalk.red("Adding a default bot with table address: " + TABLE_ADDRESS));

        const wallet = new ethers.Wallet(selectedPrivateKey);

        const defaultBot = new Bots({
            address: wallet.address,
            tableAddress: TABLE_ADDRESS,
            privateKey: selectedPrivateKey,
            type: "check",
            enabled: true
        });

        await defaultBot.save();
        console.log(chalk.green("Default bot added successfully."));

        // Push the default bot to the _bots array
        _bots.push(new CheckBot(TABLE_ADDRESS, NODE_URL, selectedPrivateKey));
    }

    for (const bot of bots) {
        if (bot.privateKey) {
            console.log(chalk.green(`Found bot with address: ${bot.address}`));
            if (bot.type === "check") {
                const checkBot: IBot = new CheckBot(bot.tableAddress, NODE_URL, bot.privateKey);
                await checkBot.joinGame();

                console.log(chalk.green(`Bot with address ${bot.address} is ready to play.`));
                _bots.push(checkBot);
                botAddresses.push(bot.address);
            }
        }
    }

    // Continuous monitoring loop
    console.log(chalk.yellow("\nStarting continuous monitoring (checking every 10 seconds)..."));
    while (play) {
        for (const address of botAddresses) {
            console.log(chalk.cyan("Time: " + new Date().toLocaleTimeString()));

            console.log(chalk.cyan("Checking bot with address:", address));
            const botDocument = await Bots.findOne({ address: address });
            if (!botDocument) {
                console.error(chalk.red(`Bot with address ${address} not found in the database.`));
                continue; // Skip to next bot if not found
            }

            if (!botDocument.enabled) {
                console.log(chalk.yellow(`Bot with address ${address} is disabled. Skipping...`));
                continue; // Skip to next bot if disabled
            }
            
            // Reload the bot from the database to ensure we have the latest state
            const bot: IBot = new CheckBot(botDocument.tableAddress, NODE_URL, botDocument.privateKey);

            try {
                await bot.performAction();
            } catch (error) {
                console.error(chalk.red("Error in main loop:"), error);
            }
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 8000));
    }
}

main().catch(error => {
    console.error(chalk.red("Fatal error:"), error);
    process.exit(1);
});
