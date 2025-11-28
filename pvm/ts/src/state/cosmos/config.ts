// CosmosConfig interface - defined locally as SDK export is not bundled correctly
export interface CosmosConfig {
    rpcEndpoint: string;
    restEndpoint: string;
    chainId: string;
    prefix: string;
    denom: string;
    gasPrice: string;
    mnemonic?: string;
}

/**
 * Default Cosmos SDK configuration for poker VM
 */
export const DEFAULT_COSMOS_CONFIG: CosmosConfig = {
    prefix: "b52",
    rpcEndpoint: "http://localhost:26657",
    restEndpoint: "http://localhost:1317",
    chainId: "pokerchain",
    denom: "usdc", // Bridged USDC from Base Chain (playing token)
    gasPrice: "0stake", // Gas is free (stake token, price = 0)
};

/**
 * Test configuration for local development
 */
export const TEST_COSMOS_CONFIG: CosmosConfig = {
    prefix: "b52",
    rpcEndpoint: "http://localhost:36657",
    restEndpoint: "http://localhost:1318",
    chainId: "pokerchain-test",
    denom: "usdc", // Bridged USDC from Base Chain (playing token)
    gasPrice: "0stake", // Gas is free (stake token, price = 0)
};

/**
 * Production configuration (values should come from environment)
 */
export const PROD_COSMOS_CONFIG: CosmosConfig = {
    rpcEndpoint: process.env.COSMOS_RPC_ENDPOINT || "",
    restEndpoint: process.env.COSMOS_REST_ENDPOINT || "",
    chainId: process.env.COSMOS_CHAIN_ID || "",
    prefix: process.env.COSMOS_PREFIX || "",
    denom: process.env.COSMOS_DENOM || "",
    gasPrice: process.env.COSMOS_GAS_PRICE || "",
    mnemonic: process.env.COSMOS_MNEMONIC
};

/**
 * Get configuration based on environment
 */
export const getCosmosConfig = (): CosmosConfig => {
    const env = process.env.NODE_ENV || "development";

    switch (env) {
        case "test":
            return TEST_COSMOS_CONFIG;
        case "production":
            return PROD_COSMOS_CONFIG;
        case "development":
        default:
            return DEFAULT_COSMOS_CONFIG;
    }
};