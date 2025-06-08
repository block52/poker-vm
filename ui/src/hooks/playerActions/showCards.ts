import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { getClient } from "../../utils/b52AccountUtils";

/**
 * Show cards in a poker game.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @returns Promise with the show response
 * @throws Error if private key is missing or if the action fails
 */
export async function showCards(tableId: string) {
    // Get the singleton client instance
    const client = getClient();

    console.log("👁️ Show cards attempt");
    console.log("👁️ Table ID:", tableId);

    // Call the playerAction method (let SDK handle nonce internally)
    const response = await client.playerAction(
        tableId,
        PlayerActionType.SHOW,
        "0" // No amount needed for showing
    );

    console.log("👁️ Show response:", response);
    return response;
}
