import { NodeRpcClient, PlayerActionType } from "@bitcoinbrisbane/block52";
import { getPrivateKey } from "../../utils/b52AccountUtils";

/**
 * Post small blind at a poker table.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @param smallBlindAmount - The small blind amount (will use game options if not provided)
 * @returns Promise with the post small blind response
 * @throws Error if private key is missing or if the action fails
 */
export async function postSmallBlind(tableId: string, smallBlindAmount: string) {
    // Get private key from storage
    const privateKey = getPrivateKey();
    if (!privateKey) {
        throw new Error("No private key found. Please connect your wallet first.");
    }

    // Create the client directly with the private key
    const nodeUrl = import.meta.env.VITE_NODE_RPC_URL || "https://node1.block52.xyz/";
    const client = new NodeRpcClient(nodeUrl, privateKey);

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
