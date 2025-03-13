import { ethers } from "ethers";
import { PlayerActionType } from "@bitcoinbrisbane/block52";

export const getSignature = async (
    privateKey: string,
    nonce: number | string,
    from?: string,
    to?: string,
    amount?: string,
    action?: string
): Promise<string> => {
    try {
        const wallet = new ethers.Wallet(privateKey);
        
        // If additional params are provided, create a complete message
        if (from && to && amount && action) {
            const message = `${from}${to}${amount}${action}${nonce}`;
            return await wallet.signMessage(message);
        }
        
        // Otherwise just sign the nonce
        return await wallet.signMessage(nonce.toString());
    } catch (error) {
        console.error("Error getting signature:", error);
        throw new Error("Failed to sign message");
    }
}; 

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