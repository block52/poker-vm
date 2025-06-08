import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { getClient } from "../../utils/b52AccountUtils";

/**
 * Post big blind at a poker table.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @param bigBlindAmount - The big blind amount (will use game options if not provided)
 * @returns Promise with the post big blind response
 * @throws Error if private key is missing or if the action fails
 */
export async function postBigBlind(tableId: string, bigBlindAmount: string) {
    // Get the singleton client instance
    const client = getClient();

    console.log("🎰 Post big blind attempt");
    console.log("🎰 Table ID:", tableId);
    console.log("🎰 Big blind amount:", bigBlindAmount);

    // Call the playerAction method (let SDK handle nonce internally)
    return client.playerAction(
        tableId,
        PlayerActionType.BIG_BLIND,
        bigBlindAmount
    ).then(response => {
        console.log("🎰 Post big blind response:", response);
        return response;
    }).catch(error => {
        console.error("🎰 Post big blind failed:", error);
        throw error; // Re-throw to let calling code handle it
    });
}
