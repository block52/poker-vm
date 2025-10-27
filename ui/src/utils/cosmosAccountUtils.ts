/**
 * Utility functions for Cosmos account management
 * Replaces b52AccountUtils.ts for Cosmos blockchain integration
 */

import { getCosmosClient } from "./cosmos/client";

/**
 * Get the user's Cosmos address from the initialized client
 * @returns The Cosmos address (b52...) or null if not found
 */
export const getCosmosAddress = async (): Promise<string | null> => {
    const client = getCosmosClient();
    if (!client) return null;

    try {
        const address = await client.getWalletAddress();
        return address;
    } catch (error) {
        console.error("Error getting Cosmos address:", error);
        return null;
    }
};

/**
 * Synchronous version that gets address from localStorage
 * @returns The Cosmos address from localStorage or null
 */
export const getCosmosAddressSync = (): string | null => {
    // Get from localStorage using the correct key (see utils/cosmos/storage.ts)
    return localStorage.getItem("user_cosmos_address") || null;
};

/**
 * Get formatted Cosmos address for display (shortened with ellipsis)
 * @param length Number of characters to show at start (default 6)
 * @returns Formatted address string like "b521rg...fj9p" or empty string if no address
 */
export const getFormattedCosmosAddress = (length: number = 6): string => {
    const address = getCosmosAddressSync();
    if (!address) return "";
    return `${address.slice(0, length)}...${address.slice(-4)}`;
};

/**
 * Check if a Cosmos wallet is connected
 * @returns True if Cosmos client is initialized and has an address
 */
export const hasCosmosWallet = (): boolean => {
    const address = getCosmosAddressSync();
    return !!address;
};

/**
 * Get Cosmos account balance for specific token
 * @param denom The token denomination to query (default: "b52usdc")
 * @returns Promise with the account balance as string in microunits (6 decimals)
 * @throws Error if wallet is not connected or fetch fails
 */
export const getCosmosBalance = async (denom: string = "usdc"): Promise<string> => {
    const client = getCosmosClient();

    if (!client) {
        throw new Error("No Cosmos wallet connected. Please create or import a wallet first.");
    }

    // Get address from localStorage instead of client.getWalletAddress() (which doesn't work in REST-only mode)
    const address = getCosmosAddressSync();
    if (!address) {
        throw new Error("No Cosmos address found. Please create or import a wallet first.");
    }

    try {
        console.log("💰 cosmosAccountUtils - Fetching balance for:", address);
        console.log("   Denomination:", denom);

        // getBalance returns bigint directly
        const balance = await client.getBalance(address, denom);

        console.log("💰 cosmosAccountUtils - Balance (bigint):", balance);
        console.log("   Amount (string):", balance.toString());

        return balance.toString();
    } catch (error) {
        console.error("❌ Error fetching Cosmos balance:", error);
        throw new Error(`Failed to fetch Cosmos balance: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
};

/**
 * Get all balances for the connected Cosmos account
 * @returns Promise with array of all token balances
 * @throws Error if wallet is not connected or fetch fails
 */
export const getAllCosmosBalances = async (): Promise<Array<{denom: string; amount: string}>> => {
    const client = getCosmosClient();

    if (!client) {
        throw new Error("No Cosmos wallet connected. Please create or import a wallet first.");
    }

    // Get address from localStorage instead of client.getWalletAddress() (which doesn't work in REST-only mode)
    const address = getCosmosAddressSync();
    if (!address) {
        throw new Error("No Cosmos address found. Please create or import a wallet first.");
    }

    try {
        const balances = await client.getAllBalances(address);
        console.log("💰 cosmosAccountUtils - All balances:", balances);

        // Convert Coin[] to our format
        return balances.map(coin => ({
            denom: coin.denom,
            amount: coin.amount
        }));
    } catch (error) {
        console.error("❌ Error fetching all Cosmos balances:", error);
        throw new Error(`Failed to fetch all balances: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
};
