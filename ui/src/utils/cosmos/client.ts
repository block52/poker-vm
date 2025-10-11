/**
 * Cosmos Client creation and management
 */

import { CosmosClient, CosmosConfig, COSMOS_CONSTANTS } from "@bitcoinbrisbane/block52";
import { getCosmosMnemonic } from "./storage";

// Re-export types and constants
export type { CosmosClient, CosmosConfig };
export { COSMOS_CONSTANTS };

/**
 * Default cosmos configuration for the frontend
 */
export const getDefaultCosmosConfig = (): CosmosConfig => ({
    rpcEndpoint: import.meta.env.VITE_COSMOS_RPC_URL || "http://localhost:26657",
    restEndpoint: import.meta.env.VITE_COSMOS_REST_URL || "http://localhost:1317",
    chainId: COSMOS_CONSTANTS.CHAIN_ID,
    prefix: COSMOS_CONSTANTS.ADDRESS_PREFIX,
    denom: COSMOS_CONSTANTS.TOKEN_DENOM,
    gasPrice: COSMOS_CONSTANTS.DEFAULT_GAS_PRICE,
});

/**
 * Create a cosmos client with the user's mnemonic
 * @param mnemonic Optional mnemonic, if not provided will try to get from storage
 * @returns CosmosClient instance or null if no mnemonic available
 */
export const createCosmosClient = (mnemonic?: string): CosmosClient | null => {
    const userMnemonic = mnemonic || getCosmosMnemonic();
    if (!userMnemonic) return null;

    const config = {
        ...getDefaultCosmosConfig(),
        mnemonic: userMnemonic
    };

    return new CosmosClient(config);
};

/**
 * Get singleton Cosmos client instance
 * This ensures we reuse the same client across the app
 */
let clientInstance: CosmosClient | null = null;

export const getCosmosClient = (): CosmosClient | null => {
    if (!clientInstance) {
        clientInstance = createCosmosClient();
    }
    return clientInstance;
};

/**
 * Clear the cached client instance (useful when changing wallets)
 */
export const clearCosmosClient = (): void => {
    clientInstance = null;
};
