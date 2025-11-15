import { createSigningClientFromMnemonic, COSMOS_CONSTANTS } from "@bitcoinbrisbane/block52";
import { getCosmosAddress, getCosmosMnemonic } from "../../utils/cosmos/storage";
import { getCosmosUrls } from "../../utils/cosmos/urls";
import type { NetworkEndpoints } from "../../context/NetworkContext";

/**
 * Leave a poker table using Cosmos SDK SigningCosmosClient.
 *
 * @param tableId - The ID of the table (game ID on Cosmos) to leave
 * @param value - The value to leave with (as string, in microunits)
 * @param network - The current network configuration from NetworkContext
 * @param _nonce - Optional nonce (not used in Cosmos SDK, kept for compatibility)
 * @returns Promise with transaction hash
 * @throws Error if Cosmos wallet is not initialized or if the action fails
 */
export async function leaveTable(tableId: string, value: string, network: NetworkEndpoints, _nonce?: number): Promise<any> {
    // Get user's Cosmos address and mnemonic
    const userAddress = getCosmosAddress();
    const mnemonic = getCosmosMnemonic();

    if (!userAddress || !mnemonic) {
        throw new Error("Cosmos wallet not initialized. Please create or import a Cosmos wallet first.");
    }

    console.log("👋 Leave table on Cosmos blockchain");
    console.log("  Player:", userAddress);
    console.log("  Game ID:", tableId);
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

    // Call SigningCosmosClient.performAction() with "leave" action
    const transactionHash = await signingClient.performAction(
        tableId,
        "leave",
        BigInt(value)
    );

    console.log("✅ Leave table transaction submitted:", transactionHash);

    return {
        hash: transactionHash,
        gameId: tableId,
        action: "leave",
        value
    };
}
