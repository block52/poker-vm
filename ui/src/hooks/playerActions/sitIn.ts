import { createSigningClientFromMnemonic, COSMOS_CONSTANTS } from "@bitcoinbrisbane/block52";
import { getCosmosAddress, getCosmosMnemonic } from "../../utils/cosmos/storage";
import { getCosmosUrls } from "../../utils/cosmos/urls";

/**
 * Sit in at a poker table using Cosmos SDK SigningCosmosClient.
 *
 * @param tableId - The ID of the table (game ID on Cosmos) where the action will be performed
 * @returns Promise with transaction hash
 * @throws Error if Cosmos wallet is not initialized or if the action fails
 */
export async function sitIn(tableId: string): Promise<any> {
    // Get user's Cosmos address and mnemonic
    const userAddress = getCosmosAddress();
    const mnemonic = getCosmosMnemonic();

    if (!userAddress || !mnemonic) {
        throw new Error("Cosmos wallet not initialized. Please create or import a Cosmos wallet first.");
    }

    console.log("🪑 Sit in on Cosmos blockchain");
    console.log("  Player:", userAddress);
    console.log("  Game ID:", tableId);

    // Create signing client from mnemonic
    const { rpcEndpoint, restEndpoint } = getCosmosUrls();

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

    // Call SigningCosmosClient.performAction() with "sit-in" action
    const transactionHash = await signingClient.performAction(
        tableId,
        "sit-in",
        0n // Sit in doesn't require an amount
    );

    console.log("✅ Sit in transaction submitted:", transactionHash);

    return {
        hash: transactionHash,
        gameId: tableId,
        action: "sit-in"
    };
}
