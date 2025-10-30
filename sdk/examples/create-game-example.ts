import { createSigningClientFromMnemonic } from "../src/signingClient";
import { getDefaultCosmosConfig, COSMOS_CONSTANTS } from "../src/cosmosClient";

/**
 * Example: Create a new poker game using the Signing Cosmos Client
 * 
 * This example demonstrates how to:
 * 1. Create a signing client from a mnemonic
 * 2. Configure game parameters
 * 3. Sign and broadcast a create game transaction
 */

async function createGameExample() {
    console.log("=== Create Poker Game Example ===\n");

    // Step 1: Setup the mnemonic and configuration
    const mnemonic = "vanish legend pelican blush control spike useful usage into any remove wear flee short october naive swear wall spy cup sort avoid agent credit";

    // Use localhost for local development, or replace with your node URL
    const config = getDefaultCosmosConfig("localhost");

    console.log("📡 Connecting to blockchain:");
    console.log("   RPC:", config.rpcEndpoint);
    console.log("   REST:", config.restEndpoint);
    console.log("   Chain ID:", config.chainId);
    console.log();

    // Step 2: Create the signing client
    console.log("🔐 Creating signing client from mnemonic...");
    const client = await createSigningClientFromMnemonic(config, mnemonic);

    const walletAddress = await client.getWalletAddress();
    console.log("   Wallet Address:", walletAddress);
    console.log();

    // Step 3: Check wallet balance
    console.log("💰 Checking wallet balance...");
    try {
        const balance = await client.getB52USDCBalance(walletAddress);
        const balanceInUsdc = client.b52usdcToUsdc(balance);
        console.log("   Balance:", balance.toString(), "b52usdc");
        console.log("   Balance:", balanceInUsdc, "USDC");
        console.log();
    } catch (error) {
        console.log("   ⚠️  Could not fetch balance (node may not be running)");
        console.log();
    }

    // Step 4: Configure game parameters
    const gameParams = {
        gameType: "texas-holdem",
        minPlayers: 2,
        maxPlayers: 6,
        minBuyIn: client.usdcToB52usdc(10),      // 10 USDC minimum buy-in
        maxBuyIn: client.usdcToB52usdc(100),     // 100 USDC maximum buy-in
        smallBlind: client.usdcToB52usdc(0.5),   // 0.5 USDC small blind
        bigBlind: client.usdcToB52usdc(1),       // 1 USDC big blind
        timeout: 60                               // 60 seconds per action
    };

    console.log("🎮 Game Configuration:");
    console.log("   Game Type:", gameParams.gameType);
    console.log("   Players:", `${gameParams.minPlayers}-${gameParams.maxPlayers}`);
    console.log("   Buy-in Range:", `${client.b52usdcToUsdc(gameParams.minBuyIn)}-${client.b52usdcToUsdc(gameParams.maxBuyIn)} USDC`);
    console.log("   Blinds:", `${client.b52usdcToUsdc(gameParams.smallBlind)}/${client.b52usdcToUsdc(gameParams.bigBlind)} USDC`);
    console.log("   Action Timeout:", `${gameParams.timeout}s`);
    console.log();

    // Step 5: Create the game (this will fail if node is not running)
    console.log("📝 Creating game transaction...");
    console.log("   Note: This requires a running blockchain node");
    console.log();

    try {
        const txHash = await client.createGame(
            gameParams.gameType,
            gameParams.minPlayers,
            gameParams.maxPlayers,
            gameParams.minBuyIn,
            gameParams.maxBuyIn,
            gameParams.smallBlind,
            gameParams.bigBlind,
            gameParams.timeout
        );

        console.log("✅ Game created successfully!");
        console.log("   Transaction Hash:", txHash);
        console.log();

        // Step 6: Wait a moment then query for the game
        console.log("⏳ Waiting for transaction to be mined...");
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Try to get transaction details
        try {
            const tx = await client.getTx(txHash);
            console.log("   Transaction confirmed at height:", tx.height);
            console.log();
        } catch (error) {
            console.log("   Transaction pending or node not responding");
            console.log();
        }

    } catch (error: any) {
        console.log("❌ Failed to create game:");
        console.log("   Error:", error.message);
        console.log();
        console.log("💡 This is expected if the blockchain node is not running.");
        console.log("   To run this example successfully:");
        console.log("   1. Start your poker blockchain node");
        console.log("   2. Ensure the wallet has sufficient balance");
        console.log("   3. Run this script again");
        console.log();
    }

    // Step 7: Disconnect
    await client.disconnect();
    console.log("=== Example Complete ===");
}

// Run the example
if (require.main === module) {
    createGameExample()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("Unhandled error:", error);
            process.exit(1);
        });
}

export { createGameExample };
