/**
 * Cosmos utilities - centralized exports
 *
 * This module provides all Cosmos-related utilities for wallet management,
 * client creation, and blockchain interactions.
 */

// Client creation and management
export {
    createCosmosClient,
    getCosmosClient,
    clearCosmosClient,
    getDefaultCosmosConfig,
    type CosmosClient,
    type CosmosConfig
} from "./client";

// Storage utilities
export {
    getCosmosMnemonic,
    getCosmosAddress,
    setCosmosMnemonic,
    setCosmosAddress,
    clearCosmosData,
    getFormattedCosmosAddress,
    STORAGE_COSMOS_MNEMONIC,
    STORAGE_COSMOS_ADDRESS
} from "./storage";

// Helper functions
export {
    isValidSeedPhrase,
    getTestAddresses
} from "./helpers";
