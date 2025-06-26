import { PerformActionResponse, PlayerActionType } from "@bitcoinbrisbane/block52";
import { getClient } from "../../utils/b52AccountUtils";

/**
 * Raise in a poker game.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @param amount - The amount to raise (as string)
 * @returns Promise with the raise response
 * @throws Error if private key is missing or if the action fails
 */
export async function raiseHand(tableId: string, amount: string): Promise<PerformActionResponse> {
    // Get the singleton client instance
    const client = getClient();

    console.log("📈 Raise attempt");
    console.log("📈 Table ID:", tableId);
    console.log("📈 Amount:", amount);

    // Call the playerAction method (let SDK handle nonce internally)
    const response = await client.playerAction(
        tableId,
        PlayerActionType.RAISE,
        amount
    );

    console.log("📈 Raise response:", response);
    return response;
}
