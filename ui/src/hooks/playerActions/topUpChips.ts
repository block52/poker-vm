

import { getClient } from "../../utils/b52AccountUtils";

/**
 * Top up chips in a poker game.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @param amount - The amount to top up (as string in Wei)
 * @returns Promise with the top up response
 * @throws Error if private key is missing or if the action fails
 */
export async function topUpChips(tableId: string, amount: string) {
    // Get the singleton client instance
    const client = getClient();

    console.log("💰 Top up chips attempt");
    console.log("💰 Table ID:", tableId);
    console.log("💰 Amount:", amount);

    // Convert amount from string to bigint for the dedicated playerTopUp method
    const amountBigInt = BigInt(amount);

    // Use the dedicated playerTopUp method (consistent with playerJoin/playerLeave pattern)
    const response = await client.playerTopUp(
        tableId,
        amountBigInt
    );

    console.log("💰 Top up chips response:", response);
    return response;
} 