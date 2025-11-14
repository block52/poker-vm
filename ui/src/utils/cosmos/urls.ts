/**
 * Centralized Cosmos network URL configuration
 * 
 * Provides consistent access to RPC and REST endpoints across the application.
 * Uses environment variables with fallback to localhost for development.
 */

export interface CosmosUrls {
    rpcEndpoint: string;
    restEndpoint: string;
}

/**
 * Get Cosmos network URLs (RPC and REST endpoints)
 * 
 * @returns Object containing rpcEndpoint and restEndpoint
 * 
 * @example
 * ```ts
 * const { rpcEndpoint, restEndpoint } = getCosmosUrls();
 * const client = await createSigningClientFromMnemonic({ rpcEndpoint, restEndpoint, ... }, mnemonic);
 * ```
 */
export function getCosmosUrls(): CosmosUrls {
    return {
        rpcEndpoint: import.meta.env.VITE_COSMOS_RPC_URL || "http://localhost:26657",
        restEndpoint: import.meta.env.VITE_COSMOS_REST_URL || "http://localhost:1317"
    };
}
