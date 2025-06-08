import { getClient } from "../../utils/b52AccountUtils";

/**
 * Deal cards in a poker game.
 * 
 * @param tableId - The ID of the table where to deal cards
 * @returns Promise with the deal response
 * @throws Error if private key is missing or if the action fails
 */
export async function dealCards(tableId: string) {
    // Get the singleton client instance
    const client = getClient();

    // Create a seed from timestamp for randomness
    const timestamp = Math.floor(Date.now() / 1000);
    const seed = `${timestamp}-${Math.random().toString(36).substring(2, 15)}`;

    console.log("🃏 Deal cards attempt");
    console.log("🃏 Table ID:", tableId);
    console.log("🃏 Seed:", seed);

    // Call the deal method (let SDK handle nonce internally)
    return client.deal(
        tableId,
        seed,
        "" // The publicKey is not actually used in the interface
    ).then(response => {
        console.log("🃏 Deal cards response:", response);
        return response;
    }).catch(error => {
        console.error("🃏 Deal cards failed:", error);
        throw error; // Re-throw to let calling code handle it
    });
}
