import { NodeRpcClient, PlayerActionType } from "@bitcoinbrisbane/block52";
import { getPrivateKey } from "../../utils/b52AccountUtils";

/**
 * Muck cards in a poker game.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @returns Promise with the muck response
 * @throws Error if private key is missing or if the action fails
 */
export async function muckCards(tableId: string) {
    // Get private key from storage
    const privateKey = getPrivateKey();
    if (!privateKey) {
        throw new Error("No private key found. Please connect your wallet first.");
    }

    // Create the client directly with the private key
    const nodeUrl = import.meta.env.VITE_NODE_RPC_URL || "https://node1.block52.xyz/";
    const client = new NodeRpcClient(nodeUrl, privateKey);

    console.log("🗑️ Muck cards attempt");
    console.log("🗑️ Table ID:", tableId);

    // Call the playerAction method (let SDK handle nonce internally)
    const response = await client.playerAction(
        tableId,
        PlayerActionType.MUCK,
        "0" // No amount needed for mucking
    );

    console.log("🗑️ Muck response:", response);
    return response;
}
