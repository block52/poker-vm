import { PerformActionResponse, PlayerActionType } from "@bitcoinbrisbane/block52";
import { getClient } from "../../utils/b52AccountUtils";

/**
 * Check (pass) in a poker game.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @returns Promise with the check response
 * @throws Error if private key is missing or if the action fails
 */
export async function checkHand(tableId: string): Promise<PerformActionResponse> {
    // Get the singleton client instance
    const client = getClient();

    console.log("✅ Check attempt");
    console.log("✅ Table ID:", tableId);

    // Call the playerAction method (let SDK handle nonce internally)
    const response = await client.playerAction(
        tableId,
        PlayerActionType.CHECK,
        "0" // Check doesn't require an amount
    );

    console.log("✅ Check response:", response);
    return response;
}
