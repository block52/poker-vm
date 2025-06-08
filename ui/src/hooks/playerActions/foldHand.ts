import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { getClient } from "../../utils/b52AccountUtils";

/**
 * Fold in a poker game.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @returns Promise with the fold response
 * @throws Error if private key is missing or if the action fails
 */
export async function foldHand(tableId: string) {
    // Get the singleton client instance
    const client = getClient();

    console.log("🗂️ Fold attempt");
    console.log("🗂️ Table ID:", tableId);

    // Call the playerAction method (let SDK handle nonce internally)
    return client.playerAction(
        tableId,
        PlayerActionType.FOLD,
        "0" // Fold doesn't require an amount
    ).then(response => {
        console.log("🗂️ Fold response:", response);
        return response;
    }).catch(error => {
        console.error("🗂️ Fold failed:", error);
        throw error; // Re-throw to let calling code handle it
    });
}
