/**
 * Example usage of Cosmos SDK integration in Poker VM
 * 
 * This file demonstrates how to:
 * 1. Initialize Cosmos SDK
 * 2. Manage account balances
 * 3. Create and manage games
 * 4. Handle transactions
 */

import { initializeCosmos, testCosmosIntegration, setupCosmosEnvironment } from "./init";
import { getCosmosAccountManagementInstance } from "./accountManagement";
import { getCosmosGameManagementInstance } from "./gameManagement";
import { getCosmosBlockchainManagementInstance } from "./blockchainManagement";
import { GameOptions, GameType } from "@bitcoinbrisbane/block52";

async function exampleUsage() {
    try {
        // 1. Setup environment (in production, set these as actual environment variables)
        setupCosmosEnvironment();

        // Set DB_URL to use Cosmos SDK
        process.env.DB_URL = "cosmos://localhost:26657";

        // 2. Initialize Cosmos SDK
        console.log("=== Initializing Cosmos SDK ===");
        const cosmos = await initializeCosmos();

        // 3. Test the integration
        console.log("\n=== Testing Integration ===");
        await testCosmosIntegration();

        // 4. Example: Account Management
        console.log("\n=== Account Management Example ===");
        const accountManagement = getCosmosAccountManagementInstance();

        // Create test accounts
        const playerPrivateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
        const playerAccount = await accountManagement.createAccount(playerPrivateKey);
        console.log(`Created player account: ${playerAccount.address}`);

        // Check balance
        const balance = await accountManagement.getBalance(playerAccount.address);
        console.log(`Player balance: ${balance.toString()}`);

        // 5. Example: Game Management
        console.log("\n=== Game Management Example ===");
        const gameManagement = getCosmosGameManagementInstance();

        // Create a new game
        const gameOptions: GameOptions = {
            minBuyIn: BigInt("1000000000000000000"), // 1 token
            maxBuyIn: BigInt("10000000000000000000"), // 10 tokens
            smallBlind: BigInt("50000000000000000"), // 0.05 tokens
            bigBlind: BigInt("100000000000000000"), // 0.1 tokens
            minPlayers: 2,
            maxPlayers: 6,
            timeout: 30000,
            type: GameType.CASH
        };

        const gameAddress = await gameManagement.create(
            BigInt(1),
            playerAccount.address,
            gameOptions
        );
        console.log(`Created game at address: ${gameAddress}`);

        // Get game state
        const gameState = await gameManagement.getByAddress(gameAddress);
        console.log(`Game state:`, gameState ? "Found" : "Not found");

        // 6. Example: Blockchain Management
        console.log("\n=== Blockchain Management Example ===");
        const blockchainManagement = getCosmosBlockchainManagementInstance();

        const height = await blockchainManagement.getBlockHeight();
        console.log(`Current blockchain height: ${height}`);

        const blocks = await blockchainManagement.getBlocks(5);
        console.log(`Retrieved ${blocks.length} blocks`);

        // 7. Example: Transaction Handling
        console.log("\n=== Transaction Example ===");

        // This would be a real transaction in production
        // For now, we'll just demonstrate the API
        try {
            const txHash = await cosmos.cosmosClient.sendTokens(
                playerAccount.address,
                "poker1recipient123", // recipient address
                BigInt("1000000"), // amount in smallest unit
                "Game deposit"
            );
            console.log(`Transaction sent: ${txHash}`);
        } catch (error) {
            console.log("Transaction simulation (would work with real setup)");
        }

        console.log("\n=== Example completed successfully ===");

    } catch (error) {
        console.error("Example failed:", error);
    }
}

// Run the example if this file is executed directly
if (require.main === module) {
    exampleUsage().catch(console.error);
}

export { exampleUsage };