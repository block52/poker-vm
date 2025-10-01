import { CosmosConfig } from "@bitcoinbrisbane/block52";

/**
 * Default Cosmos SDK configuration for poker VM
 */
export const DEFAULT_COSMOS_CONFIG: CosmosConfig = {
    prefix: "b52",
    rpcEndpoint: "http://localhost:26657",
    chainId: "pokerchain",
    denom: "b52USD",
    gasPrice: "0.025",
};

/**
 * Test configuration for local development
 */
export const TEST_COSMOS_CONFIG: CosmosConfig = {
    prefix: "b52",
    rpcEndpoint: "http://localhost:36657",
    chainId: "pokerchain-test",
    denom: "b52USD",
    gasPrice: "0.01",
};

/**
 * Development configuration
 */
export const DEV_COSMOS_CONFIG: CosmosConfig = {
    rpcEndpoint: "http://localhost:26657",
    chainId: "poker-vm-dev",
    prefix: "poker",
    denom: "upvm",
    gasPrice: "0.025upvm"
};

/**
 * Production configuration (values should come from environment)
 */
export const PROD_COSMOS_CONFIG: CosmosConfig = {
    rpcEndpoint: process.env.COSMOS_RPC_ENDPOINT!,
    chainId: process.env.COSMOS_CHAIN_ID!,
    prefix: process.env.COSMOS_PREFIX!,
    denom: process.env.COSMOS_DENOM!,
    gasPrice: process.env.COSMOS_GAS_PRICE!,
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

/**
 * Validate Cosmos configuration
 */
export const validateCosmosConfig = (config: CosmosConfig): void => {
    if (!config.rpcEndpoint) {
        throw new Error("Cosmos RPC endpoint is required");
    }

    if (!config.chainId) {
        throw new Error("Cosmos chain ID is required");
    }

    if (!config.prefix) {
        throw new Error("Cosmos address prefix is required");
    }

    if (!config.denom) {
        throw new Error("Cosmos denomination is required");
    }

    if (!config.gasPrice) {
        throw new Error("Cosmos gas price is required");
    }
};

/**
 * Environment variables documentation
 */
export const COSMOS_ENV_VARS = {
    COSMOS_RPC_ENDPOINT: "Cosmos SDK RPC endpoint (e.g., http://localhost:26657)",
    COSMOS_CHAIN_ID: "Cosmos chain ID (e.g., poker-vm-1)",
    COSMOS_PREFIX: "Address prefix (e.g., poker)",
    COSMOS_DENOM: "Token denomination (e.g., upvm)",
    COSMOS_GAS_PRICE: "Gas price (e.g., 0.025upvm)",
    COSMOS_MNEMONIC: "Mnemonic for signing transactions (optional, for development only)"
};