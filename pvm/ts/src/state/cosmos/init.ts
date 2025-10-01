import { initializeCosmosClient } from "@bitcoinbrisbane/block52";
import { getCosmosConfig, validateCosmosConfig } from "./config";
import { getCosmosAccountManagementInstance } from "./accountManagement";
import { getCosmosBlockchainManagementInstance } from "./blockchainManagement";
import { getCosmosGameManagementInstance } from "./gameManagement";

/**
 * Initialize the Cosmos SDK integration for poker VM
 */
export async function initializeCosmos() {
    try {
        console.log("Initializing Cosmos SDK integration...");

        // Get and validate configuration
        const config = getCosmosConfig();
        validateCosmosConfig(config);

        console.log(`Connecting to Cosmos chain: ${config.chainId}`);
        console.log(`RPC Endpoint: ${config.rpcEndpoint}`);

        // Initialize the Cosmos client
        const cosmosClient = initializeCosmosClient(config);

        // Test connection
        await cosmosClient.initClient();
        const height = await cosmosClient.getHeight();
        console.log(`Connected to Cosmos chain at height: ${height}`);

        // Initialize management instances
        const accountManagement = getCosmosAccountManagementInstance();
        const blockchainManagement = getCosmosBlockchainManagementInstance();
        const gameManagement = getCosmosGameManagementInstance();

        console.log("Cosmos SDK integration initialized successfully");

        return {
            cosmosClient,
            accountManagement,
            blockchainManagement,
            gameManagement,
            config
        };
    } catch (error) {
        console.error("Failed to initialize Cosmos SDK integration:", error);
        throw error;
    }
}

/**
 * Test the Cosmos SDK integration
 */
export async function testCosmosIntegration() {
    try {
        console.log("Testing Cosmos SDK integration...");

        const { cosmosClient, accountManagement } = await initializeCosmos();

        // Test wallet functionality (if mnemonic is provided)
        try {
            const walletAddress = await cosmosClient.getWalletAddress();
            console.log(`Wallet address: ${walletAddress}`);

            const balance = await cosmosClient.getBalance(walletAddress);
            console.log(`Wallet balance: ${balance.toString()} ${getCosmosConfig().denom}`);
        } catch (error) {
            console.log("Wallet functionality not available (no mnemonic provided)");
        }

        // Test blockchain operations
        const height = await cosmosClient.getHeight();
        console.log(`Current chain height: ${height}`);

        // Test game management
        const gameManagement = getCosmosGameManagementInstance();
        const allGames = await gameManagement.getAll();
        console.log(`Current game count: ${allGames.length}`);

        console.log("Cosmos SDK integration test completed successfully");

        return true;
    } catch (error) {
        console.error("Cosmos SDK integration test failed:", error);
        return false;
    }
}

/**
 * Setup environment variables for Cosmos SDK
 */
export function setupCosmosEnvironment() {
    const defaultValues = {
        COSMOS_RPC_ENDPOINT: "http://localhost:26657",
        COSMOS_CHAIN_ID: "poker-vm-1",
        COSMOS_PREFIX: "poker",
        COSMOS_DENOM: "upvm",
        COSMOS_GAS_PRICE: "0.025upvm"
    };

    for (const [key, defaultValue] of Object.entries(defaultValues)) {
        if (!process.env[key]) {
            process.env[key] = defaultValue;
            console.log(`Set ${key} to default value: ${defaultValue}`);
        }
    }
}

/**
 * Migration helper: switch from MongoDB/Redis to Cosmos SDK
 */
export async function migrateToCosmosSDK() {
    console.log("Starting migration to Cosmos SDK...");

    // This function would:
    // 1. Initialize Cosmos SDK
    // 2. Export data from MongoDB/Redis
    // 3. Import data to Cosmos SDK
    // 4. Validate migration
    // 5. Update configuration

    console.log("Migration to Cosmos SDK would be implemented here");
    console.log("Steps would include:");
    console.log("1. Export existing account balances");
    console.log("2. Export existing game states");
    console.log("3. Export blockchain data");
    console.log("4. Initialize Cosmos SDK with exported data");
    console.log("5. Validate data integrity");
    console.log("6. Update DB_URL to use cosmos://");
}

// Export initialization function for use in main application
export { initializeCosmos as default };