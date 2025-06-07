import { NodeRpcClient, PlayerActionType } from "@bitcoinbrisbane/block52";
import { getPrivateKey } from "../../utils/b52AccountUtils";

/**
 * Check (pass) in a poker game.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @returns Promise with the check response
 * @throws Error if private key is missing or if the action fails
 */
export async function checkHand(tableId: string) {
    // Get private key from storage
    const privateKey = getPrivateKey();
    if (!privateKey) {
        throw new Error("No private key found. Please connect your wallet first.");
    }

    // Create the client directly with the private key
    const nodeUrl = import.meta.env.VITE_NODE_RPC_URL || "https://node1.block52.xyz/";
    const client = new NodeRpcClient(nodeUrl, privateKey);

    console.log("✅ Check attempt");
    console.log("✅ Table ID:", tableId);

    // Call the playerAction method (let SDK handle nonce internally)
    const response = await client.playerAction(
        tableId,
        PlayerActionType.CHECK,
        "0" // Check doesn't require an amount
    );

    console.log("✅ Check response:", response);
    return response;
}
