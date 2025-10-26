import { useState, useCallback } from "react";
import { createSigningClientFromMnemonic, COSMOS_CONSTANTS } from "@bitcoinbrisbane/block52";
import { getCosmosAddress, getCosmosMnemonic } from "../utils/cosmos/storage";

interface SitAndGoJoinOptions {
    tableId: string;
    amount: number;  // Amount in USDC (will be converted to microunits)
}

interface UseSitAndGoPlayerJoinRandomSeatReturn {
    joinSitAndGo: (options: SitAndGoJoinOptions) => Promise<any>;
    isJoining: boolean;
    error: Error | null;
}

/**
 * Custom hook for joining Sit & Go games using Cosmos SDK
 *
 * This hook automatically selects a random available seat when joining a Sit & Go game.
 * It uses the Cosmos SDK's joinGame method with seat number 0 to indicate random selection.
 *
 * AMOUNT HANDLING:
 * - INPUT: User inputs amount as number in USDC (e.g., 10 = $10 USDC)
 * - CONVERSION: Converts to microunits (multiply by 1,000,000)
 * - TRANSMISSION: Passes microunits to Cosmos SDK as BigInt
 *
 * @returns Object with joinSitAndGo function, loading state, and error
 */
export const useSitAndGoPlayerJoinRandomSeat = (): UseSitAndGoPlayerJoinRandomSeatReturn => {
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const joinSitAndGo = useCallback(async (options: SitAndGoJoinOptions): Promise<any> => {
        setIsJoining(true);
        setError(null);

        try {
            // Get user's Cosmos address and mnemonic
            const userAddress = getCosmosAddress();
            const mnemonic = getCosmosMnemonic();

            if (!userAddress || !mnemonic) {
                throw new Error("Cosmos wallet not initialized. Please create or import a Cosmos wallet first.");
            }

            console.log("🎮 [SIT & GO JOIN] Starting join process with random seat");
            console.log(`📍 Game ID: ${options.tableId}`);
            console.log(`💰 Amount (USDC): $${options.amount}`);

            // Convert USDC to microunits (1 USDC = 1,000,000 microunits)
            const amountInMicrounits = options.amount * 1_000_000;
            console.log(`📊 Amount in microunits: ${amountInMicrounits}`);

            // Create signing client from mnemonic
            const rpcEndpoint = import.meta.env.VITE_COSMOS_RPC_URL || "http://localhost:26657";
            const restEndpoint = import.meta.env.VITE_COSMOS_REST_URL || "http://localhost:1317";

            const signingClient = await createSigningClientFromMnemonic(
                {
                    rpcEndpoint,
                    restEndpoint,
                    chainId: COSMOS_CONSTANTS.CHAIN_ID,
                    prefix: COSMOS_CONSTANTS.ADDRESS_PREFIX,
                    denom: "b52Token", // Gas token
                    gasPrice: "0.025b52Token"
                },
                mnemonic
            );

            // Join game with seat = 0 to indicate random seat selection
            // The blockchain/PVM will automatically assign an available seat
            const transactionHash = await signingClient.joinGame(
                options.tableId,
                0, // Seat 0 = random seat selection
                BigInt(amountInMicrounits)
            );

            console.log("✅ [SIT & GO JOIN] Successfully joined at random seat:", transactionHash);

            return {
                hash: transactionHash,
                gameId: options.tableId,
                action: "join-random-seat",
                amount: amountInMicrounits
            };

        } catch (err: any) {
            const errorMessage = err.message || "Failed to join Sit & Go game";
            console.error("❌ [SIT & GO JOIN] Error:", err);
            setError(new Error(errorMessage));
            throw err;
        } finally {
            setIsJoining(false);
        }
    }, []);

    return {
        joinSitAndGo,
        isJoining,
        error
    };
};
