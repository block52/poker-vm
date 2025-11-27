import { createSigningClientFromMnemonic, COSMOS_CONSTANTS } from "@bitcoinbrisbane/block52";
import { getCosmosAddress, getCosmosMnemonic } from "../../utils/cosmos/storage";
import { getCosmosUrls } from "../../utils/cosmos/urls";
import type { NetworkEndpoints } from "../../context/NetworkContext";
import type { PlayerActionResult } from "../../types";

/**
 * Post big blind in a poker game using Cosmos SDK SigningCosmosClient.
 *
 * @param tableId - The ID of the table (game ID on Cosmos) where the action will be performed
 * @param amount - The big blind amount in micro-units as bigint (10^6 precision)
 * @param network - The current network configuration from NetworkContext
 * @returns Promise with PlayerActionResult containing transaction details
 * @throws Error if Cosmos wallet is not initialized or if the action fails
 */
export async function postBigBlind(tableId: string, amount: bigint, network: NetworkEndpoints): Promise<PlayerActionResult> {
    // Get user's Cosmos address and mnemonic
    const userAddress = getCosmosAddress();
    const mnemonic = getCosmosMnemonic();

    if (!userAddress || !mnemonic) {
        throw new Error("Cosmos wallet not initialized. Please create or import a Cosmos wallet first.");
    }

    console.log("🎰 Post big blind on Cosmos blockchain");
    console.log("  Player:", userAddress);
    console.log("  Game ID:", tableId);
    console.log("  Big blind amount:", amount.toString());

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

    // Call SigningCosmosClient.performAction() with "post-big-blind" action
    const transactionHash = await signingClient.performAction(
        tableId,
        "post-big-blind",
        amount
    );

    console.log("✅ Post big blind transaction submitted:", transactionHash);

    return {
        hash: transactionHash,
        gameId: tableId,
        action: "post-big-blind",
        amount: amount.toString()
    };
}
