import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { getClient } from "../../utils/b52AccountUtils";

/**
 * Call in a poker game.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @returns Promise with the call response
 * @throws Error if private key is missing or if the action fails
 */
export async function callHand(tableId: string) {
    // Get the singleton client instance
    const client = getClient();

    console.log("📞 Call attempt");
    console.log("📞 Table ID:", tableId);

    // Call the playerAction method (let SDK handle nonce internally)
    return client.playerAction(
        tableId,
        PlayerActionType.CALL,
        "0" // Call amount is determined by the game state
    ).then(response => {
        console.log("📞 Call response:", response);
        return response;
    }).catch(error => {
        console.error("📞 Call failed:", error);
        throw error; // Re-throw to let calling code handle it
    });
}
