import { NodeRpcClient } from "@bitcoinbrisbane/block52";
import { getPrivateKey } from "../../utils/b52AccountUtils";

/**
 * Deal cards in a poker game.
 * 
 * @param tableId - The ID of the table where to deal cards
 * @returns Promise with the deal response
 * @throws Error if private key is missing or if the action fails
 */
export async function dealCards(tableId: string) {
    // Get private key from storage
    const privateKey = getPrivateKey();
    if (!privateKey) {
        throw new Error("No private key found. Please connect your wallet first.");
    }

    // Create the client directly with the private key
    const nodeUrl = import.meta.env.VITE_NODE_RPC_URL || "https://node1.block52.xyz/";
    const client = new NodeRpcClient(nodeUrl, privateKey);

    // Create a seed from timestamp for randomness
    const timestamp = Math.floor(Date.now() / 1000);
    const seed = `${timestamp}-${Math.random().toString(36).substring(2, 15)}`;

    console.log("🃏 Deal cards attempt");
    console.log("🃏 Table ID:", tableId);
    console.log("🃏 Seed:", seed);

    // Call the deal method (let SDK handle nonce internally)
    const response = await client.deal(
        tableId,
        seed,
        "" // The publicKey is not actually used in the interface
    );

    console.log("🃏 Deal cards response:", response);
    return response;
}
