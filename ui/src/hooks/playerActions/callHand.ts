import { PerformActionResponse, PlayerActionType } from "@bitcoinbrisbane/block52";
import { getClient } from "../../utils/b52AccountUtils";

/**
 * Call in a poker game.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @returns Promise with the call response
 * @throws Error if private key is missing or if the action fails
 */
export async function callHand(tableId: string, amount: bigint): Promise<PerformActionResponse> {
    // Get the singleton client instance
    const client = getClient();

    console.log("📞 Call attempt");
    console.log("📞 Table ID:", tableId);

    // Call the playerAction method (backend determines correct call amount)
    const response = await client.playerAction(
        tableId,
        PlayerActionType.CALL,
        amount.toString()
    );

    console.log("📞 Call response:", response);
    return response;
}
