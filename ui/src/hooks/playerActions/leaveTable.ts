import { PerformActionResponse } from "@bitcoinbrisbane/block52";
import { getClient } from "../../utils/b52AccountUtils";

/**
 * Leave a poker table.
 * 
 * @param tableId - The ID of the table to leave
 * @param value - The value to leave with (as string)
 * @param nonce - Optional nonce for the transaction
 * @returns Promise with the leave table response
 * @throws Error if private key is missing or if the action fails
 */
export async function leaveTable(tableId: string, value: string, nonce?: number): Promise<PerformActionResponse> {
    // Get the singleton client instance
    const client = getClient();

    console.log("👋 Leave table attempt");
    console.log("👋 Table ID:", tableId);
    console.log("👋 Value:", value);
    console.log("👋 Nonce:", nonce);

    // Call the playerLeave method (let SDK handle nonce if not provided)
    const response = await client.playerLeave(tableId, value, nonce);

    console.log("👋 Leave table response:", response);
    return response;
}