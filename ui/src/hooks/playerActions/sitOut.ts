import { createSigningClientFromMnemonic, COSMOS_CONSTANTS } from "@bitcoinbrisbane/block52";
import { getCosmosAddress, getCosmosMnemonic } from "../../utils/cosmos/storage";
import { getCosmosUrls } from "../../utils/cosmos/urls";
import type { NetworkEndpoints } from "../../context/NetworkContext";
import type { PlayerActionResult } from "../../types";

/**
 * Sit out in a poker game using Cosmos SDK SigningCosmosClient.
 *
 * @param tableId - The ID of the table (game ID on Cosmos) where the action will be performed
 * @param network - The current network configuration from NetworkContext
 * @returns Promise with PlayerActionResult containing transaction details
 * @throws Error if Cosmos wallet is not initialized or if the action fails
 */
export async function sitOut(tableId: string, network: NetworkEndpoints): Promise<PlayerActionResult> {
    // Get user's Cosmos address and mnemonic
    const userAddress = getCosmosAddress();
    const mnemonic = getCosmosMnemonic();

    if (!userAddress || !mnemonic) {
        throw new Error("Cosmos wallet not initialized. Please create or import a Cosmos wallet first.");
    }

    console.log("🪑 Sit out on Cosmos blockchain");
    console.log("  Player:", userAddress);
    console.log("  Game ID:", tableId);

    // Create signing client from mnemonic using the selected network
    const { rpcEndpoint, restEndpoint } = getCosmosUrls(network);

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

    // Call SigningCosmosClient.performAction() with "sit-out" action
    const transactionHash = await signingClient.performAction(
        tableId,
        "sit-out",
        0n // Sit out doesn't require an amount
    );

    console.log("✅ Sit out transaction submitted:", transactionHash);

    return {
        hash: transactionHash,
        gameId: tableId,
        action: "sit-out"
    };
}
