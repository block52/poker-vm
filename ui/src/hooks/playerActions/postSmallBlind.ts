import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { getClient } from "../../utils/b52AccountUtils";

/**
 * Post small blind at a poker table.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @param smallBlindAmount - The small blind amount (will use game options if not provided)
 * @returns Promise with the post small blind response
 * @throws Error if private key is missing or if the action fails
 */
export async function postSmallBlind(tableId: string, smallBlindAmount: string) {
    // Get the singleton client instance
    const client = getClient();

    console.log("🎰 Post small blind attempt");
    console.log("🎰 Table ID:", tableId);
    console.log("🎰 Small blind amount:", smallBlindAmount);

    // Call the playerAction method (let SDK handle nonce internally)
    const response = await client.playerAction(
        tableId,
        PlayerActionType.SMALL_BLIND,
        smallBlindAmount
    );

    console.log("🎰 Post small blind response:", response);
    return response;
}
