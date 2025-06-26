import { getClient } from "../../utils/b52AccountUtils";

/**
 * Start a new hand at a poker table.
 * 
 * @param tableId - The ID of the table where to start a new hand
 * @returns Promise with the new hand response
 * @throws Error if private key is missing or if the action fails
 */
export async function startNewHand(tableId: string) {
    // Get the singleton client instance
    const client = getClient();

    console.log("🃏 Start new hand attempt");
    console.log("🃏 Table ID:", tableId);

    // Call the newHand method (let SDK handle nonce internally)
    const response = await client.newHand(tableId, 0);

    console.log("🃏 Start new hand response:", response);
    return response;
}
