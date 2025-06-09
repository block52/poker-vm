import { ethers } from "ethers";

/**
 * Get public key from private key
 * @param privateKey The private key
 * @returns The uncompressed public key
 */
export const getPublicKey = (privateKey: string): string => {
    try {
        const wallet = new ethers.Wallet(privateKey);
        return wallet.signingKey.publicKey;
    } catch (error) {
        console.error("Error getting public key:", error);
        throw new Error("Failed to get public key");
    }
};

/**
 * Format player ID for display
 * @param playerId The player's ID or address
 * @returns Formatted string with first 6 and last 4 characters
 */
export const formatPlayerId = (playerId: string) => {
    return `${playerId.slice(0, 6)}...${playerId.slice(-4)}`;
};

/**
 * Format amount from wei to dollars
 * @param amount The amount in wei
 * @returns Formatted string with dollar sign and 2 decimal places
 */
export const formatAmount = (amount: string) => {
    return `$${(Number(amount) / 10 ** 18).toFixed(2)}`;
};
