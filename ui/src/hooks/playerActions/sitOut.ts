import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { getClient } from "../../utils/b52AccountUtils";

/**
 * Sit out at a poker table.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @returns Promise with the sit out response
 * @throws Error if private key is missing or if the action fails
 */
export async function sitOut(tableId: string) {
    // Get the singleton client instance
    const client = getClient();

    console.log("🚶 Sit out attempt");
    console.log("🚶 Table ID:", tableId);

    // Call the playerAction method (let SDK handle nonce internally)
    return client.playerAction(
        tableId,
        PlayerActionType.SIT_OUT,
        "0" // Sit out doesn't require an amount
    ).then(response => {
        console.log("🚶 Sit out response:", response);
        return response;
    }).catch(error => {
        console.error("🚶 Sit out failed:", error);
        throw error; // Re-throw to let calling code handle it
    });
}
