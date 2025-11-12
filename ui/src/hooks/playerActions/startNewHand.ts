import { createSigningClientFromMnemonic, COSMOS_CONSTANTS } from "@bitcoinbrisbane/block52";
import { getCosmosAddress, getCosmosMnemonic } from "../../utils/cosmos/storage";

/**
 * Start a new hand at a poker table using Cosmos SDK SigningCosmosClient.
 *
 * @param tableId - The ID of the table (game ID on Cosmos) where to start a new hand
 * @returns Promise with transaction hash
 * @throws Error if Cosmos wallet is not initialized or if the action fails
 */
export async function startNewHand(tableId: string): Promise<any> {
    // Get user's Cosmos address and mnemonic
    const userAddress = getCosmosAddress();
    const mnemonic = getCosmosMnemonic();

    if (!userAddress || !mnemonic) {
        throw new Error("Cosmos wallet not initialized. Please create or import a Cosmos wallet first.");
    }

    console.log("🃏 Start new hand on Cosmos blockchain");
    console.log("  Player:", userAddress);
    console.log("  Game ID:", tableId);

    // Create signing client from mnemonic
    const rpcEndpoint = import.meta.env.VITE_COSMOS_RPC_URL || "http://localhost:26657";
    const restEndpoint = import.meta.env.VITE_COSMOS_REST_URL || "http://localhost:1317";

    const signingClient = await createSigningClientFromMnemonic(
        {
            rpcEndpoint,
            restEndpoint,
            chainId: COSMOS_CONSTANTS.CHAIN_ID,
            prefix: COSMOS_CONSTANTS.ADDRESS_PREFIX,
            denom: "stake", // Gas token
            gasPrice: "0.025stake"
        },
        mnemonic
    );

    // Call SigningCosmosClient.performAction() with "new-hand" action
    const transactionHash = await signingClient.performAction(
        tableId,
        "new-hand",
        0n // No amount needed for starting a new hand
    );

    console.log("✅ Start new hand transaction submitted:", transactionHash);

    return {
        hash: transactionHash,
        gameId: tableId,
        action: "new-hand"
    };
}
