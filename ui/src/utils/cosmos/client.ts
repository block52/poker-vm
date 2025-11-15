/**
 * Cosmos Client creation and management
 *
 * This file provides a minimal wrapper around the SDK's CosmosClient
 * with singleton pattern for the frontend.
 */

import { CosmosClient, getDefaultCosmosConfig as getDefaultCosmosConfigSDK, COSMOS_CONSTANTS } from "@bitcoinbrisbane/block52";
import { getCosmosMnemonic } from "./storage";
import { getCosmosUrls, type NetworkEndpoints } from "./urls";

// Re-export types and constants from SDK
export type { CosmosClient };
export { COSMOS_CONSTANTS };

/**
 * Get default cosmos configuration with environment variable overrides
 * Uses SDK's getDefaultCosmosConfig() and overrides with env vars if present
 */
export const getDefaultCosmosConfig = (network: NetworkEndpoints) => {
    const sdkConfig = getDefaultCosmosConfigSDK();
    const { rpcEndpoint, restEndpoint } = getCosmosUrls(network);

    return {
        ...sdkConfig,
        rpcEndpoint,
        restEndpoint,
    };
};

/**
 * Get cosmos configuration with custom endpoints
 * Used when switching networks dynamically
 */
export const getCosmosConfigWithEndpoints = (rpcEndpoint: string, restEndpoint: string) => {
    const sdkConfig = getDefaultCosmosConfigSDK();

    return {
        ...sdkConfig,
        rpcEndpoint,
        restEndpoint,
    };
};

/**
 * Get singleton Cosmos client instance
 * This ensures we reuse the same client across the app
 */
let clientInstance: CosmosClient | null = null;
let currentEndpoints: { rpc: string; rest: string } | null = null;

export const getCosmosClient = (
    networkOrEndpoints: NetworkEndpoints | { rpc: string; rest: string }
): CosmosClient | null => {
    // Determine if we have custom endpoints or a network config
    const customEndpoints = "rpc" in networkOrEndpoints && "rest" in networkOrEndpoints && !("name" in networkOrEndpoints)
        ? networkOrEndpoints as { rpc: string; rest: string }
        : null;

    const network = customEndpoints ? null : networkOrEndpoints as NetworkEndpoints;

    // If custom endpoints are provided and different from current, clear the client
    if (customEndpoints) {
        if (
            !currentEndpoints ||
            currentEndpoints.rpc !== customEndpoints.rpc ||
            currentEndpoints.rest !== customEndpoints.rest
        ) {
            clientInstance = null;
            currentEndpoints = customEndpoints;
        }
    }

    if (!clientInstance) {
        const mnemonic = getCosmosMnemonic();
        if (!mnemonic) {
            // For read-only operations (like explorer), create client without mnemonic
            const config = customEndpoints
                ? getCosmosConfigWithEndpoints(customEndpoints.rpc, customEndpoints.rest)
                : getDefaultCosmosConfig(network!);
            clientInstance = new CosmosClient(config);
        } else {
            const config = customEndpoints
                ? getCosmosConfigWithEndpoints(customEndpoints.rpc, customEndpoints.rest)
                : getDefaultCosmosConfig(network!);
            clientInstance = new CosmosClient({ ...config, mnemonic });
        }
    }
    return clientInstance;
};

/**
 * Clear the cached client instance (useful when changing wallets or networks)
 */
export const clearCosmosClient = (): void => {
    clientInstance = null;
    currentEndpoints = null;
};
