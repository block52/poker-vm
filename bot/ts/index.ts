import dotenv from "dotenv";
import { IBot } from "./interfaces";
import { CheckBot } from "./CheckBot";
import { connectDB } from "./mongoConnection";
import Bots from "./schema/bots";
import { RaiseOrCallBot } from "./RaiseOrCallBot";
import { RandomBot } from "./RandomBot";
import { ClaudeBot } from "./ClaudBot";
import { NodeRpcClient } from "@bitcoinbrisbane/block52";
import { logger } from "./src/utils/logger";

dotenv.config();

// Add nonce tracking
let play = true;
const allBots: Record<string, IBot> = {};
let client: NodeRpcClient;
const blackList: string[] = []; // Add blacklisted addresses here

// Modify the main loop to include small blind posting
async function main() {

    const connectionString = process.env.DB_URL;
    if (!connectionString) {
        logger.error("No database connection string provided. Please set the DB_URL environment variable.");
        process.exit(1);
    }
    await connectDB.connect(connectionString);

    logger.info("Connected to MongoDB database.");
    logger.info("Using DB: " + connectionString);

    const NODE_URL = process.env.NODE_URL;
    if (!NODE_URL) {
        logger.error("No Ethereum node URL provided. Please set the NODE_URL environment variable.");
        process.exit(1);
    }

    client = new NodeRpcClient(NODE_URL, "");

    // Continuous monitoring loop
    logger.info("Starting continuous monitoring (checking every 10 seconds)...");
    while (play) {

        const bots = await Bots.find();
        const enabledBots = bots.filter(bot => bot.enabled);

        console.table(bots, ["address", "tableAddress", "type", "enabled"]);
        logger.info("Found " + enabledBots.length + " enabled bots in the database.");

        if (enabledBots.length === 0) {
            logger.warn("No enabled bots found. Sleeping for 30 seconds.");
            // Sleep for 30 seconds before checking again
            await new Promise(resolve => setTimeout(resolve, 30000));
            continue;
        }

        for (const bot of bots) {
            if (allBots[bot.address] && bot.enabled) {
                // Bot is already active
                continue;
            }

            if (!bot.enabled) {
                // Skip disabled bots
                logger.info(`Bot with address ${bot.address} is disabled. Skipping.`);
                continue;
            }

            if (allBots[bot.address] && !bot.enabled) {
                // Remove disabled bot from active bots
                logger.info(`Bot with address ${bot.address} is no longer enabled. Removing from active bots.`);
                delete allBots[bot.address];
                continue;
            }

            if (bot.privateKey) {

                if (blackList.includes(bot.tableAddress)) {
                    logger.warn(`Table address ${bot.tableAddress} is blacklisted. Skipping bot with address ${bot.address}.`);
                    continue;
                }

                logger.info(`Found bot with address: ${bot.address}`);
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
                    logger.info(`Joining game for bot with address: ${bot.address} to table: ${bot.tableAddress}`);
                    const joined = await botInstance.joinGame();
                    if (joined) {
                        allBots[bot.address] = botInstance;
                    } else {
                        logger.error(`Bot with address ${bot.address} failed to join the game at table ${bot.tableAddress}. It will not be activated.`);
                        blackList.push(bot.tableAddress);
                    }
                }
            }
        }

        for (const bot of Object.values(allBots)) {
            logger.debug("Time: " + new Date().toLocaleTimeString());

            const enabled = Bots.find({ address: bot.me });
            if (!enabled) {
                logger.info(`Bot with address ${bot.me} is no longer enabled. Removing from active bots.`);
                delete allBots[bot.me];
                continue;
            }

            // Perform action for each bot
            try {
                await bot.performAction();

                // Wait before next check
                await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (error) {
                logger.error("Error in main loop:", error);
            }
        }
    }
}

main().catch(error => {
    logger.error("Fatal error:", error);
    process.exit(1);
});
