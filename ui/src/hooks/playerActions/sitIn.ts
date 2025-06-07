import { NodeRpcClient, PlayerActionType } from "@bitcoinbrisbane/block52";
import { getPrivateKey } from "../../utils/b52AccountUtils";

/**
 * Sit in at a poker table.
 * 
 * @param tableId - The ID of the table where the action will be performed
 * @returns Promise with the sit in response
 * @throws Error if private key is missing or if the action fails
 */
export async function sitIn(tableId: string) {
    // Get private key from storage
    const privateKey = getPrivateKey();
    if (!privateKey) {
        throw new Error("No private key found. Please connect your wallet first.");
    }

    // Create the client directly with the private key
    const nodeUrl = import.meta.env.VITE_NODE_RPC_URL || "https://node1.block52.xyz/";
    const client = new NodeRpcClient(nodeUrl, privateKey);

    console.log("🪑 Sit in attempt");
    console.log("🪑 Table ID:", tableId);

    // Call the playerAction method (let SDK handle nonce internally)
    const response = await client.playerAction(
        tableId,
        PlayerActionType.SIT_IN,
        "0" // Sit in doesn't require an amount
    );

    console.log("🪑 Sit in response:", response);
    return response;
}
