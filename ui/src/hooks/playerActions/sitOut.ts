import { PerformActionResponse, PlayerActionType } from "@bitcoinbrisbane/block52";
import { getClient } from "../../utils/b52AccountUtils";

/**
 * Sit out in a poker game.
 *
 * @param tableId - The ID of the table where the action will be performed
 * @returns Promise with the sit out response
 * @throws Error if private key is missing or if the action fails
 */
export async function sitOut(tableId: string): Promise<PerformActionResponse> {
    // Get the singleton client instance
    const client = getClient();

    console.log("🪑 Sit out attempt");
    console.log("🪑 Table ID:", tableId);

    // Call the playerAction method (let SDK handle nonce internally)
    const response = await client.playerAction(
        tableId,
        PlayerActionType.SIT_OUT,
        "0" // Sit out doesn't require an amount
    );

    return response;
}