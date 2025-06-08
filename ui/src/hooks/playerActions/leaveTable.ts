import { PerformActionResponse } from "@bitcoinbrisbane/block52";
import { getClient } from "../../utils/b52AccountUtils";

/**
 * Leave a poker table.
 * 
 * @param tableId - The ID of the table to leave
 * @param amount - The amount to leave with (as string)
 * @param nonce - Optional nonce for the transaction
 * @returns Promise with the leave table response
 * @throws Error if private key is missing or if the action fails
 */
export async function leaveTable(tableId: string, amount: string, nonce?: number): Promise<PerformActionResponse> {
    // Get the singleton client instance
    const client = getClient();

    // Convert the amount from string to bigint
    const amountBigInt = BigInt(amount);
    
    console.log("👋 Leave table attempt");
    console.log("👋 Table ID:", tableId);
    console.log("👋 Amount:", amountBigInt.toString());
    console.log("👋 Nonce:", nonce);

    // Call the playerLeave method (let SDK handle nonce if not provided)
    const response = await client.playerLeave(tableId, amountBigInt, nonce);
    
    console.log("👋 Leave table response:", response);
    return response;
}