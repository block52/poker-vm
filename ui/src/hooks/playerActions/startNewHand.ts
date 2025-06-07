import { NodeRpcClient } from "@bitcoinbrisbane/block52";
import { getPrivateKey } from "../../utils/b52AccountUtils";

/**
 * Start a new hand at a poker table.
 * 
 * @param tableId - The ID of the table where to start a new hand
 * @param seed - Optional seed for randomization (will generate random if not provided)
 * @returns Promise with the new hand response
 * @throws Error if private key is missing or if the action fails
 */
export async function startNewHand(tableId: string, seed?: string) {
    // Get private key from storage
    const privateKey = getPrivateKey();
    if (!privateKey) {
        throw new Error("No private key found. Please connect your wallet first.");
    }

    // Create the client directly with the private key
    const nodeUrl = import.meta.env.VITE_NODE_RPC_URL || "https://node1.block52.xyz/";
    const client = new NodeRpcClient(nodeUrl, privateKey);

    // Generate seed if not provided
    const finalSeed = seed || Math.random().toString(36).substring(2, 15);

    console.log("🃏 Start new hand attempt");
    console.log("🃏 Table ID:", tableId);
    console.log("🃏 Seed:", finalSeed);

    // Call the newHand method (let SDK handle nonce internally)
    const response = await client.newHand(tableId, 0);

    console.log("🃏 Start new hand response:", response);
    return response;
}
