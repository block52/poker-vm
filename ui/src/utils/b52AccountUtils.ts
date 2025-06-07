/**
 * Utility functions for Block52 account management
 */

import { NodeRpcClient } from "@bitcoinbrisbane/block52";

/**
 * Get the user's private key from browser storage
 * @returns The private key string or null if not found
 */
export function getPrivateKey(): string | null {
    return localStorage.getItem("user_eth_private_key");
}

/**
 * Get the user's public key from browser storage
 * @returns The public key string or null if not found
 */
export function getPublicKey(): string | null {
    return localStorage.getItem("user_eth_public_key");
}

/**
 * Set the user's private key in browser storage
 * @param privateKey The private key to store
 */
export function setPrivateKey(privateKey: string): void {
    localStorage.setItem("user_eth_private_key", privateKey);
}

/**
 * Remove the user's private key from browser storage
 */
export function clearPrivateKey(): void {
    localStorage.removeItem("user_eth_private_key");
}

/**
 * Check if a private key is available
 * @returns True if private key exists in storage
 */
export function hasPrivateKey(): boolean {
    return getPrivateKey() !== null;
}

/**
 * Get account balance directly from the blockchain
 * @returns Promise with the account balance as string
 * @throws Error if private key or public key is missing, or if the fetch fails
 */
export async function getAccountBalance(): Promise<string> {
    const privateKey = getPrivateKey();
    const publicKey = getPublicKey();
    
    if (!privateKey) {
        throw new Error("No private key found. Please connect your wallet first.");
    }
    
    if (!publicKey) {
        throw new Error("No public key found. Please connect your wallet first.");
    }

    // Create the client directly with the private key
    const nodeUrl = import.meta.env.VITE_NODE_RPC_URL || "https://node1.block52.xyz/";
    const client = new NodeRpcClient(nodeUrl, privateKey);

    const account = await client.getAccount(publicKey);
    return account.balance.toString();
}
