import { createSigningClientFromMnemonic, COSMOS_CONSTANTS } from "@bitcoinbrisbane/block52";
import { getCosmosAddress, getCosmosMnemonic } from "../../utils/cosmos/storage";
import { getCosmosUrls } from "../../utils/cosmos/urls";
import type { JoinTableOptions } from "./types";
import type { NetworkEndpoints } from "../../context/NetworkContext";
import type { JoinTableResult } from "../../types";

/**
 * Joins a poker table using Cosmos SDK SigningCosmosClient.
 *
 * @param {string} tableId - The ID of the table to join (game ID on Cosmos).
 * @param {JoinTableOptions} options - Options for joining the table, including buy-in amount and seat number.
 * @param {NetworkEndpoints} network - The current network configuration from NetworkContext.
 * @returns {Promise<JoinTableResult>} - The transaction result including hash, gameId, seat, and buyInAmount.
 * @throws {Error} - If the table ID is not provided or if an error occurs during the join operation.
 */
export async function joinTable(tableId: string, options: JoinTableOptions, network: NetworkEndpoints): Promise<JoinTableResult> {
    if (!tableId) {
        throw new Error("Table ID is required to join a table");
    }

    // Get user's Cosmos address and mnemonic
    const userAddress = getCosmosAddress();
    const mnemonic = getCosmosMnemonic();

    if (!userAddress || !mnemonic) {
        throw new Error("Cosmos wallet not initialized. Please create or import a Cosmos wallet first.");
    }

    console.log("🪑 joinTable - Joining game on Cosmos blockchain:");
    console.log("  Player:", userAddress);
    console.log("  Game ID:", tableId);
    console.log("  Buy-in amount (string):", options.amount);
    console.log("  Seat number:", options.seatNumber);

    // Create signing client from mnemonic using the selected network
    const { rpcEndpoint, restEndpoint } = getCosmosUrls(network);

    const signingClient = await createSigningClientFromMnemonic(
        {
            rpcEndpoint,
            restEndpoint,
            chainId: COSMOS_CONSTANTS.CHAIN_ID,
            prefix: COSMOS_CONSTANTS.ADDRESS_PREFIX,
            denom: "stake", // Gas token (use "stake" for testnet)
            gasPrice: "0.025stake" // Chain requires minimum fees
        },
        mnemonic
    );

    // Convert buy-in amount from USDC to micro-USDC (b52usdc)
    // options.amount is in USDC (e.g., "5.00"), need to convert to micro-units (e.g., 5000000)
    const amountInUsdc = parseFloat(options.amount);
    const buyInAmount = BigInt(Math.floor(amountInUsdc * Math.pow(10, COSMOS_CONSTANTS.USDC_DECIMALS)));

    // If seatNumber is not provided, default to 0
    const seat = options.seatNumber !== undefined && options.seatNumber !== null
        ? options.seatNumber
        : 0;

    console.log("🪑 Calling SigningCosmosClient.joinGame:");
    console.log("  Game ID:", tableId);
    console.log("  Seat:", seat);
    console.log("  Buy-in:", buyInAmount, "usdc");

    // Call SigningCosmosClient.joinGame()
    const transactionHash = await signingClient.joinGame(
        tableId,
        seat,
        buyInAmount
    );

    console.log("✅ Join game transaction submitted:", transactionHash);

    return {
        hash: transactionHash,
        gameId: tableId,
        seat,
        buyInAmount: buyInAmount.toString()
    };
}
