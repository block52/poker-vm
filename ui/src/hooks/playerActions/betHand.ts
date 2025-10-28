import { PerformActionResponse, PlayerActionType } from "@bitcoinbrisbane/block52";
import { getClient } from "../../utils/b52AccountUtils";

/**
 * Bet in a poker game.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @param amount - The amount to bet
 * @returns Promise with the bet response
 * @throws Error if private key is missing or if the action fails
 */
export async function betHand(tableId: string, amount: bigint): Promise<PerformActionResponse> {
    // Get the singleton client instance
    const client = getClient();

    console.log("💰 Bet attempt");
    console.log("💰 Table ID:", tableId);
    console.log("💰 Amount:", amount);

    // Call the playerAction method (let SDK handle nonce internally)
    const response = await client.playerAction(
        tableId,
        PlayerActionType.BET,
        amount.toString()
    );

    console.log("💰 Bet response:", response);
    return response;
}
