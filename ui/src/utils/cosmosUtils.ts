/**
 * Utility functions for Cosmos integration
 */

import { CosmosClient, CosmosConfig } from "@bitcoinbrisbane/block52";

// Export types for use in other files
export type { CosmosClient, CosmosConfig };

// Storage keys for cosmos data
export const STORAGE_COSMOS_MNEMONIC = "user_cosmos_mnemonic";
export const STORAGE_COSMOS_ADDRESS = "user_cosmos_address";

/**
 * Validates if a string is a valid BIP39 mnemonic seed phrase
 * @param seedPhrase The seed phrase to validate
 * @returns boolean indicating if the seed phrase is valid
 */
export const isValidSeedPhrase = (seedPhrase: string): boolean => {
    if (!seedPhrase.trim()) return false;

    // Basic validation: should be 12, 15, 18, 21, or 24 words
    const words = seedPhrase.trim().split(/\s+/);
    const validWordCounts = [12, 15, 18, 21, 24];

    if (!validWordCounts.includes(words.length)) return false;

    // Check that all words are lowercase letters (basic mnemonic format)
    const mnemonicPattern = /^[a-z]+$/;
    return words.every(word => mnemonicPattern.test(word));
};

/**
 * Get the user's cosmos mnemonic from browser storage
 * @returns The mnemonic string or null if not found
 */
export const getCosmosMnemonic = (): string | null => {
    return localStorage.getItem(STORAGE_COSMOS_MNEMONIC);
};

/**
 * Get the user's cosmos address from browser storage
 * @returns The address string or null if not found
 */
export const getCosmosAddress = (): string | null => {
    return localStorage.getItem(STORAGE_COSMOS_ADDRESS);
};

/**
 * Set the user's cosmos mnemonic in browser storage
 * @param mnemonic The mnemonic to store
 */
export const setCosmosMnemonic = (mnemonic: string): void => {
    localStorage.setItem(STORAGE_COSMOS_MNEMONIC, mnemonic);
};

/**
 * Set the user's cosmos address in browser storage
 * @param address The address to store
 */
export const setCosmosAddress = (address: string): void => {
    localStorage.setItem(STORAGE_COSMOS_ADDRESS, address);
};

/**
 * Remove the user's cosmos data from browser storage
 */
export const clearCosmosData = (): void => {
    localStorage.removeItem(STORAGE_COSMOS_MNEMONIC);
    localStorage.removeItem(STORAGE_COSMOS_ADDRESS);
};

/**
 * Get formatted cosmos address for display (shortened with ellipsis)
 * @returns Formatted address string like "b521234...abcd" or empty string if no address
 */
export const getFormattedCosmosAddress = (length: number = 6): string => {
    const address = getCosmosAddress();
    if (!address) return "";
    return `${address.slice(0, length)}...${address.slice(-4)}`;
};

/**
 * Default cosmos configuration for the frontend
 */
export const getDefaultCosmosConfig = (): CosmosConfig => ({
    rpcEndpoint: "http://localhost:26657",
    chainId: "pokerchain",
    prefix: "b52",
    denom: "b52USD",
    gasPrice: "0.025b52USD",
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
 * Get test addresses from the local chain (alice, bob, etc.)
 * Useful for development and testing
 * @returns Object with test account addresses
 */
export const getTestAddresses = async () => {
    try {
        const restUrl = import.meta.env.VITE_COSMOS_REST_URL || "http://localhost:1317";

        // Query alice and bob balances to get their addresses
        // In development, these are the default test accounts
        return {
            alice: "b521xa0ue7p4z4vlfphkvxwz0w8sj5gam8zxszqy9l",
            bob: "b521qu2qmrc6rve2az7r74nc5jh5fuqe8j5fpd7hq0",
            restUrl: restUrl
        };
    } catch (error) {
        console.error("Failed to get test addresses:", error);
        return null;
    }
};