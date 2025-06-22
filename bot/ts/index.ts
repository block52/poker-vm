import chalk from "chalk";
import dotenv from "dotenv";
import { IBot } from "./interfaces";
import { CheckBot } from "./CheckBot";
import { connectDB } from "./mongoConnection";
import Bots from "./schema/bots";
import { RaiseOrCallBot } from "./RaiseOrCallBot";
import { RandomBot } from "./RandomBot";
import { ClaudeBot } from "./ClaudBot";
import { ethers } from "ethers";

dotenv.config();

// Add nonce tracking
let play = true;
const _bots: IBot[] = [];
const tableAddress: string[] = [];

// Modify the main loop to include small blind posting
async function main() {
    const connectionString = process.env.DB_URL;
    if (!connectionString) {
        console.error(chalk.red("No database connection string provided. Please set the DB_URL environment variable."));
        process.exit(1);
    }
    await connectDB.connect(connectionString);

    console.log(chalk.green("Connected to MongoDB database."));
    console.log(chalk.green("Using DB: " + connectionString));

    const NODE_URL = process.env.NODE_URL || "https://node1.block52.xzy"; // Replace with your Ethereum node URL
    if (!NODE_URL) {
        console.error(chalk.red("No Ethereum node URL provided. Please set the NODE_URL environment variable."));
        process.exit(1);
    }

    const bots = await Bots.find({ enabled: true });

    console.table(bots, ["address", "tableAddress", "type", "enabled"]);
    console.log(chalk.green("Found " + bots.length + " enabled bots in the database."));

    if (bots.length === 0) {
        // const TABLE_ADDRESS = process.env.TABLE_ADDRESS || ethers.ZeroAddress; // Replace with your default table address
        // console.error(chalk.red("No enabled bots found in the database."));
        // console.error(chalk.red("Adding a default bot with table address: " + TABLE_ADDRESS));

        // // Remove the global pk variable since we'll use the selected key
        // let privateKey: string = process.env.PRIVATE_KEY || "";
        // if (!privateKe) {
        //     console.error(chalk.red("No private key provided. Please set the PRIVATE_KEY environment variable."));
        //     process.exit(1);
        // }

        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || "");

        const defaultBot = new Bots({
            address: wallet.address,
            tableAddress: "0x7fac1de2961cd3c4fe7b529d39a80c329a23bd51",
            privateKey: process.env.PRIVATE_KEY || "",
            type: "raiseOrCall", // Default type
            enabled: true
        });

        await defaultBot.save();
        console.log(chalk.green("Default bot added successfully."));

        // // Push the default bot to the _bots array
        _bots.push(new RaiseOrCallBot("0x7fac1de2961cd3c4fe7b529d39a80c329a23bd51", NODE_URL, process.env.PRIVATE_KEY || ""));

        // console.error(chalk.red("No enabled bots found in the database. Please add a bot to the database before running this script."));
        // process.exit(1);
    }

    for (const bot of bots) {
        if (bot.privateKey) {
            console.log(chalk.green(`Found bot with address: ${bot.address}`));
            if (bot.type === "check") {
                const checkBot: IBot = new CheckBot(bot.tableAddress, NODE_URL, bot.privateKey);

                console.log(chalk.green(`Joining game for bot with address: ${bot.address} to table: ${bot.tableAddress}`));
                const joined = await checkBot.joinGame();
                if (joined) {
                    _bots.push(checkBot);
                    tableAddress.push(bot.tableAddress);
                }
            }

            if (bot.type === "raiseOrCall") {
                const raiseOrCallBot: IBot = new RaiseOrCallBot(bot.tableAddress, NODE_URL, bot.privateKey);

                console.log(chalk.green(`Joining game for bot with address: ${bot.address} to table: ${bot.tableAddress}`));
                const joined = await raiseOrCallBot.joinGame();
                if (joined) {
                    _bots.push(raiseOrCallBot);
                    tableAddress.push(bot.tableAddress);
                }
            }

            if (bot.type === "random") {
                const randomBot: IBot = new RandomBot(bot.tableAddress, NODE_URL, bot.privateKey);

                console.log(chalk.green(`Joining game for bot with address: ${bot.address} to table: ${bot.tableAddress}`));
                const joined = await randomBot.joinGame();
                if (joined) {
                    _bots.push(randomBot);
                    tableAddress.push(bot.tableAddress);
                }
            }

            if (bot.type === "claude") {
                const claudeBot: IBot = new ClaudeBot(bot.tableAddress, NODE_URL, bot.privateKey, process.env.API_KEY || "");

                console.log(chalk.green(`Joining game for bot with address: ${bot.address} to table: ${bot.tableAddress}`));
                const joined = await claudeBot.joinGame();
                if (joined) {
                    _bots.push(claudeBot);
                    tableAddress.push(bot.tableAddress);
                }
            }
        }
    }

    // Continuous monitoring loop
    console.log(chalk.yellow("\nStarting continuous monitoring (checking every 10 seconds)..."));
    while (play) {
        for (const address of tableAddress) {
            console.log(chalk.cyan("Time: " + new Date().toLocaleTimeString()));

            console.log(chalk.cyan("Checking bot with address:", address));
            // Get the bot for this table
            const botDocument = await Bots.findOne({ tableAddress: address });
            if (!botDocument) {
                console.error(chalk.red(`Bot for table address ${address} not found in the database.`));
                continue; // Skip to next bot if not found
            }

            if (!botDocument.enabled) {
                console.log(chalk.yellow(`Bot with address ${botDocument.address} is disabled. Skipping...`));
                continue; // Skip to next bot if disabled
            }

            let bot: IBot;

            switch (botDocument.type) {
                case "check":
                    console.log(chalk.green(`Performing check action for bot with address: ${botDocument.address}`));
                    bot = new CheckBot(botDocument.tableAddress, NODE_URL, botDocument.privateKey);
                    break;
                case "raiseOrCall":
                    console.log(chalk.green(`Performing raise or call action for bot with address: ${botDocument.address}`));
                    // Create a new RaiseOrCallBot instance for this bot
                    bot = new RaiseOrCallBot(botDocument.tableAddress, NODE_URL, botDocument.privateKey);
                    break;
                case "random":
                    console.log(chalk.green(`Performing random action for bot with address: ${botDocument.address}`));
                    // Create a new RandomBot instance for this bot
                    bot = new RandomBot(botDocument.tableAddress, NODE_URL, botDocument.privateKey);
                    break;
                case "claude":
                    console.log(chalk.green(`Performing claude actions for bot with address: ${botDocument.address}`));
                    bot = new ClaudeBot(botDocument.tableAddress, NODE_URL, botDocument.privateKey, process.env.API_KEY || "");
                    break;
                default:
                    console.error(chalk.red(`Unknown bot type: ${botDocument.type} for address: ${botDocument.address}`));
                    continue; // Skip to next bot if type is unknown
            }
            
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
