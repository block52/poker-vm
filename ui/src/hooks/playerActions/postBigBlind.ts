import { NodeRpcClient, PlayerActionType } from "@bitcoinbrisbane/block52";
import { getPrivateKey } from "../../utils/b52AccountUtils";

/**
 * Post big blind at a poker table.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @param bigBlindAmount - The big blind amount (will use game options if not provided)
 * @returns Promise with the post big blind response
 * @throws Error if private key is missing or if the action fails
 */
export async function postBigBlind(tableId: string, bigBlindAmount: string) {
    // Get private key from storage
    const privateKey = getPrivateKey();
    if (!privateKey) {
        throw new Error("No private key found. Please connect your wallet first.");
    }

    // Create the client directly with the private key
    const nodeUrl = import.meta.env.VITE_NODE_RPC_URL || "https://node1.block52.xyz/";
    const client = new NodeRpcClient(nodeUrl, privateKey);

    console.log("🎰 Post big blind attempt");
    console.log("🎰 Table ID:", tableId);
    console.log("🎰 Big blind amount:", bigBlindAmount);

    // Call the playerAction method (let SDK handle nonce internally)
    const response = await client.playerAction(
        tableId,
        PlayerActionType.BIG_BLIND,
        bigBlindAmount
    );

    console.log("🎰 Post big blind response:", response);
    return response;
}
