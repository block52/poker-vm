import { getClient } from "../../utils/b52AccountUtils";

/**
 * Start a new hand at a poker table.
 * 
 * @param tableId - The ID of the table where to start a new hand
 * @param seed - Optional seed for randomization (will generate random if not provided)
 * @returns Promise with the new hand response
 * @throws Error if private key is missing or if the action fails
 */
export async function startNewHand(tableId: string, seed?: string) {
    // Get the singleton client instance
    const client = getClient();

    // Generate seed if not provided
    const finalSeed = seed || Math.random().toString(36).substring(2, 15);

    console.log("🃏 Start new hand attempt");
    console.log("🃏 Table ID:", tableId);
    console.log("🃏 Seed:", finalSeed);

    // Call the newHand method (let SDK handle nonce internally)
    return client.newHand(tableId, 0).then(response => {
        console.log("🃏 Start new hand response:", response);
        return response;
    }).catch(error => {
        console.error("🃏 Start new hand failed:", error);
        throw error; // Re-throw to let calling code handle it
    });
}
