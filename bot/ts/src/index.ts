import { logger } from "./utils/logger";

// ...existing code...

async function startBot() {
    try {
        logger.info("Starting poker bot", { version: "1.0.0" });

        // ...existing bot initialization code...

        logger.info("Poker bot started successfully");
    } catch (error) {
        logger.error("Failed to start poker bot", { error: error.message });
        process.exit(1);
    }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
    logger.info("Received SIGTERM, shutting down gracefully");
    await logger.close();
    process.exit(0);
});

process.on("SIGINT", async () => {
    logger.info("Received SIGINT, shutting down gracefully");
    await logger.close();
    process.exit(0);
});

startBot();
