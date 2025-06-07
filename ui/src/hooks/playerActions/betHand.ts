import { NodeRpcClient, PlayerActionType } from "@bitcoinbrisbane/block52";
import { getPrivateKey } from "../../utils/b52AccountUtils";

/**
 * Bet in a poker game.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @param amount - The amount to bet (as string)
 * @returns Promise with the bet response
 * @throws Error if private key is missing or if the action fails
 */
export async function betHand(tableId: string, amount: string) {
    // Get private key from storage
    const privateKey = getPrivateKey();
    if (!privateKey) {
        throw new Error("No private key found. Please connect your wallet first.");
    }

    // Create the client directly with the private key
    const nodeUrl = import.meta.env.VITE_NODE_RPC_URL || "https://node1.block52.xyz/";
    const client = new NodeRpcClient(nodeUrl, privateKey);

    console.log("💰 Bet attempt");
    console.log("💰 Table ID:", tableId);
    console.log("💰 Amount:", amount);

    // Call the playerAction method (let SDK handle nonce internally)
    const response = await client.playerAction(
        tableId,
        PlayerActionType.BET,
        amount
    );

    console.log("💰 Bet response:", response);
    return response;
}
