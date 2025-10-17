/**
 * Cosmos Client creation and management
 *
 * This file provides a minimal wrapper around the SDK's CosmosClient
 * with singleton pattern for the frontend.
 */

import { CosmosClient, getDefaultCosmosConfig as getDefaultCosmosConfigSDK, COSMOS_CONSTANTS } from "@bitcoinbrisbane/block52";
import { getCosmosMnemonic } from "./storage";

// Re-export types and constants from SDK
export type { CosmosClient };
export { COSMOS_CONSTANTS };

/**
 * Get default cosmos configuration with environment variable overrides
 * Uses SDK's getDefaultCosmosConfig() and overrides with env vars if present
 */
export const getDefaultCosmosConfig = () => {
    const sdkConfig = getDefaultCosmosConfigSDK();

    return {
        ...sdkConfig,
        rpcEndpoint: import.meta.env.VITE_COSMOS_RPC_URL || sdkConfig.rpcEndpoint,
        restEndpoint: import.meta.env.VITE_COSMOS_REST_URL || sdkConfig.restEndpoint,
    };
};

/**
 * Get singleton Cosmos client instance
 * This ensures we reuse the same client across the app
 */
let clientInstance: CosmosClient | null = null;

export const getCosmosClient = (): CosmosClient | null => {
    if (!clientInstance) {
        const mnemonic = getCosmosMnemonic();
        if (!mnemonic) return null;

        const config = getDefaultCosmosConfig();
        clientInstance = new CosmosClient({ ...config, mnemonic });
    }
    return clientInstance;
};

/**
 * Clear the cached client instance (useful when changing wallets)
 */
export const clearCosmosClient = (): void => {
    clientInstance = null;
};
