import { NodeRpcClient, PlayerActionType } from "@bitcoinbrisbane/block52";
import { getPrivateKey } from "../../utils/b52AccountUtils";

/**
 * Fold in a poker game.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @returns Promise with the fold response
 * @throws Error if private key is missing or if the action fails
 */
export async function foldHand(tableId: string) {
    // Get private key from storage
    const privateKey = getPrivateKey();
    if (!privateKey) {
        throw new Error("No private key found. Please connect your wallet first.");
    }

    // Create the client directly with the private key
    const nodeUrl = import.meta.env.VITE_NODE_RPC_URL || "https://node1.block52.xyz/";
    const client = new NodeRpcClient(nodeUrl, privateKey);

    console.log("🗂️ Fold attempt");
    console.log("🗂️ Table ID:", tableId);

    // Call the playerAction method (let SDK handle nonce internally)
    const response = await client.playerAction(
        tableId,
        PlayerActionType.FOLD,
        "0" // Fold doesn't require an amount
    );

    console.log("🗂️ Fold response:", response);
    return response;
}
