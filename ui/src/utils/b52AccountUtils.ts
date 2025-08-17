/**
 * Utility functions for Block52 account management
 */

import { NodeRpcClient } from "@bitcoinbrisbane/block52";

// Singleton instance for NodeRpcClient
let clientInstance: NodeRpcClient | null = null;

/**
 * Get the user's private key from browser storage
 * @returns The private key string or null if not found
 */
export const getPrivateKey = (): string | null => {
    return localStorage.getItem("user_eth_private_key");
}

/**
 * Get the user's public key from browser storage
 * @returns The public key string or null if not found
 */
export const getPublicKey = (): string | null => {
    return localStorage.getItem("user_eth_public_key");
}

/**
 * Get formatted address for display (shortened with ellipsis)
 * @returns Formatted address string like "0x1234...abcd" or empty string if no address
 */
export const getFormattedAddress = (length: number = 6): string => {
    const pubKey = getPublicKey();
    if (!pubKey) return "";
    return `${pubKey.slice(0, length)}...${pubKey.slice(-4)}`;
}

/**
 * Set the user's private key in browser storage
 * @param privateKey The private key to store
 */
export const setPrivateKey = (privateKey: string): void => {
    localStorage.setItem("user_eth_private_key", privateKey);
    // Clear the client instance when private key changes
    clientInstance = null;
}

/**
 * Remove the user's private key from browser storage
 */
export const clearPrivateKey = (): void => {
    localStorage.removeItem("user_eth_private_key");
    // Clear the client instance when private key is removed
    clientInstance = null;
}

/**
 * Check if a private key is available
 * @returns True if private key exists in storage
 */
export const hasPrivateKey = (): boolean => {
    return getPrivateKey() !== null;
}

/**
 * Get singleton NodeRpcClient instance
 * @returns NodeRpcClient instance
 * @throws Error if private key is missing
 */
export const getClient = (): NodeRpcClient => {
    const privateKey = getPrivateKey();
    if (!privateKey) {
        throw new Error("No private key found. Please connect your wallet first.");
    }

    // Return existing instance if private key hasn't changed
    if (clientInstance) {
        return clientInstance;
    }

    // Create new client instance
    const nodeUrl = import.meta.env.VITE_NODE_RPC_URL || "https://node1.block52.xyz/";
    clientInstance = new NodeRpcClient(nodeUrl, privateKey);
    
    return clientInstance;
}

/**
 * Clear the client instance (useful when private key changes or for testing)
 */
export const clearClientInstance = (): void => {
    clientInstance = null;
}

/**
 * Get account balance directly from the blockchain
 * @returns Promise with the account balance as string
 * @throws Error if private key or public key is missing, or if the fetch fails
 */
export const getAccountBalance = async (): Promise<string> => {
    const publicKey = getPublicKey();
    
    if (!publicKey) {
        throw new Error("No public key found. Please connect your wallet first.");
    }

    // Use singleton client instance
    const client = getClient();
    const account = await client.getAccount(publicKey);
    return account.balance.toString();
}
