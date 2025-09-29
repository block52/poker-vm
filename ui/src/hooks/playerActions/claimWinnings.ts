import { PerformActionResponse } from "@bitcoinbrisbane/block52";
import { getClient } from "../../utils/b52AccountUtils";

/**
 * Claim winnings in a SIT_AND_GO poker game after it ends.
 *
 * @param tableId - The ID of the table where the winnings will be claimed
 * @returns Promise with the claim response
 * @throws Error if private key is missing or if the action fails
 */
export async function claimWinnings(tableId: string): Promise<PerformActionResponse> {
    // Get the singleton client instance
    const client = getClient();

    console.log("💰 Claim winnings attempt");
    console.log("💰 Table ID:", tableId);

    // TODO: Replace string literal with NonPlayerActionType.CLAIM after SDK update
    // Call the playerAction method (let SDK handle nonce internally)
    const response = await client.playerAction(
        tableId,
        "claim" as any, // Cast to any temporarily until SDK is updated
        "0" // Claim doesn't require an amount (payout comes from table)
    );

    console.log("💰 Claim response:", response);
    return response;
}