import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { getClient } from "../../utils/b52AccountUtils";

/**
 * Muck cards in a poker game.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @returns Promise with the muck response
 * @throws Error if private key is missing or if the action fails
 */
export async function muckCards(tableId: string) {
    // Get the singleton client instance
    const client = getClient();

    console.log("🗑️ Muck cards attempt");
    console.log("🗑️ Table ID:", tableId);

    // Call the playerAction method (let SDK handle nonce internally)
    const response = await client.playerAction(
        tableId,
        PlayerActionType.MUCK,
        "0" // No amount needed for mucking
    );

    console.log("🗑️ Muck response:", response);
    return response;
}
