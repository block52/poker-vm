import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { getClient } from "../../utils/b52AccountUtils";

/**
 * Sit in at a poker table.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @returns Promise with the sit in response
 * @throws Error if private key is missing or if the action fails
 */
export async function sitIn(tableId: string) {
    // Get the singleton client instance
    const client = getClient();

    console.log("🪑 Sit in attempt");
    console.log("🪑 Table ID:", tableId);

    // Call the playerAction method (let SDK handle nonce internally)
    const response = await client.playerAction(
        tableId,
        PlayerActionType.SIT_IN,
        "0" // Sit in doesn't require an amount
    );

    console.log("🪑 Sit in response:", response);
    return response;
}
