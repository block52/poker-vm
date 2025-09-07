import chalk from "chalk";
import dotenv from "dotenv";
import { IBot } from "./interfaces";
import { CheckBot } from "./CheckBot";
import { connectDB } from "./mongoConnection";
import Bots from "./schema/bots";
import { RaiseOrCallBot } from "./RaiseOrCallBot";
import { RandomBot } from "./RandomBot";
import { ClaudeBot } from "./ClaudBot";
import { NodeRpcClient, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { ethers } from "ethers";

dotenv.config();

// Add nonce tracking
let play = true;
const allBots: Record<string, IBot> = {};
let client;

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

    const NODE_URL = process.env.NODE_URL;
    if (!NODE_URL) {
        console.error(chalk.red("No Ethereum node URL provided. Please set the NODE_URL environment variable."));
        process.exit(1);
    }

    client = new NodeRpcClient(NODE_URL, "");

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

        // const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || "");

        // const defaultBot = new Bots({
        //     address: wallet.address,
        //     tableAddress: "0x7fac1de2961cd3c4fe7b529d39a80c329a23bd51",
        //     privateKey: process.env.PRIVATE_KEY || "",
        //     type: "raiseOrCall", // Default type
        //     enabled: true
        // });

        // await defaultBot.save();
        // console.log(chalk.green("Default bot added successfully."));

        // // Push the default bot to the _bots array
        // _bots.push(new RaiseOrCallBot("0x7fac1de2961cd3c4fe7b529d39a80c329a23bd51", NODE_URL, process.env.PRIVATE_KEY || ""));

        // console.error(chalk.red("No enabled bots found in the database. Please add a bot to the database before running this script."));
        // process.exit(1);
    }

    for (const bot of bots) {
        if (bot.privateKey) {
            console.log(chalk.green(`Found bot with address: ${bot.address}`));
            let botInstance: IBot | null = null;

            // Make this a switch statement
            switch (bot.type) {
                case "check":
                    botInstance = new CheckBot(bot.tableAddress, NODE_URL, bot.privateKey);
                    break;
                case "raiseOrCall":
                    botInstance = new RaiseOrCallBot(bot.tableAddress, NODE_URL, bot.privateKey);
                    break;
                case "random":
                    botInstance = new RandomBot(bot.tableAddress, NODE_URL, bot.privateKey);
                    break;
                case "claude":
                    botInstance = new ClaudeBot(bot.tableAddress, NODE_URL, bot.privateKey, process.env.API_KEY || "");
                    break;
            }

            if (botInstance) {
                console.log(chalk.green(`Joining game for bot with address: ${bot.address} to table: ${bot.tableAddress}`));
                const joined = await botInstance.joinGame();
                if (joined) {
                    allBots[bot.address] = botInstance;
                }
            }
        }
    }

    // Continuous monitoring loop
    console.log(chalk.yellow("\nStarting continuous monitoring (checking every 10 seconds)..."));
    while (play) {

        // const game: TexasHoldemStateDTO = await client.getGameState("0xeb563377d3f7805ff663bd78770acec870cf9c33", ethers.ZeroAddress);
        // console.log(chalk.cyan("Next player to act:"), game.nextToAct);

        // const playerAddress = game.players.find(p => p.seat === game.nextToAct)?.address;
        // if (playerAddress && allBots[playerAddress]) {
        //     const bot = allBots[playerAddress];
        //     await bot.performAction();
        // }

        for (const bot of Object.values(allBots)) {
            console.log(chalk.cyan("Time: " + new Date().toLocaleTimeString()));

            try {
                await bot.performAction();

                // Wait before next check
                await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (error) {
                console.error(chalk.red("Error in main loop:"), error);
            }
        }
    }
}

main().catch(error => {
    console.error(chalk.red("Fatal error:"), error);
    process.exit(1);
});
