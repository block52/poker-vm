import { useState, useCallback } from "react";
import { GameType, COSMOS_CONSTANTS, createSigningClientFromMnemonic } from "@bitcoinbrisbane/block52";
import { getCosmosAddress, getCosmosMnemonic } from "../utils/cosmos/storage";
import { getCosmosUrls } from "../utils/cosmos/urls";
import { useNetwork } from "../context/NetworkContext";

// Type for creating new table options
export interface CreateTableOptions {
    type: GameType;
    minBuyIn: number;
    maxBuyIn: number;
    minPlayers: number;
    maxPlayers: number;
    smallBlind: number;
    bigBlind: number;
}

// Type for useNewTable hook return
export interface UseNewTableReturn {
    createTable: (gameOptions: CreateTableOptions) => Promise<string | null>;
    isCreating: boolean;
    error: Error | null;
    newGameId: string | null;
}

/**
 * Custom hook to create a new game on Cosmos blockchain using SigningCosmosClient
 * @returns Object with createTable function, loading state, and error
 */
export const useNewTable = (): UseNewTableReturn => {
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [newGameId, setNewGameId] = useState<string | null>(null);
    const { currentNetwork } = useNetwork();

    const createTable = useCallback(async (
        gameOptions: CreateTableOptions
    ): Promise<string | null> => {
        setIsCreating(true);
        setError(null);
        setNewGameId(null);

        try {
            // Get user's Cosmos address and mnemonic
            const userAddress = getCosmosAddress();
            const mnemonic = getCosmosMnemonic();

            if (!userAddress || !mnemonic) {
                throw new Error("Cosmos wallet not initialized. Please create or import a Cosmos wallet first.");
            }

            // Create signing client from mnemonic
            const { rpcEndpoint, restEndpoint } = getCosmosUrls(currentNetwork);

            const signingClient = await createSigningClientFromMnemonic(
                {
                    rpcEndpoint,
                    restEndpoint,
                    chainId: COSMOS_CONSTANTS.CHAIN_ID,
                    prefix: COSMOS_CONSTANTS.ADDRESS_PREFIX,
                    denom: "stake", // Gas token (use "stake" for testnet, "b52Token" for production)
                    gasPrice: "0.025stake"
                },
                mnemonic
            );

            // Convert buy-in from dollars to uusdc micro-units using SDK constants
            const minBuyInB52USDC = BigInt(Math.floor(gameOptions.minBuyIn * Math.pow(10, COSMOS_CONSTANTS.USDC_DECIMALS)));
            const maxBuyInB52USDC = BigInt(Math.floor(gameOptions.maxBuyIn * Math.pow(10, COSMOS_CONSTANTS.USDC_DECIMALS)));

            // Convert blind values from dollars to micro-units
            const smallBlindB52USDC = BigInt(Math.floor(gameOptions.smallBlind * Math.pow(10, COSMOS_CONSTANTS.USDC_DECIMALS)));
            const bigBlindB52USDC = BigInt(Math.floor(gameOptions.bigBlind * Math.pow(10, COSMOS_CONSTANTS.USDC_DECIMALS)));

            console.log("🎮 Game Settings:");
            console.log(`  Game Type: ${gameOptions.type}`);
            console.log(`  Entry Fee: $${gameOptions.minBuyIn} - $${gameOptions.maxBuyIn}`);
            console.log(`  Blinds: $${gameOptions.smallBlind}/$${gameOptions.bigBlind} (input)`);
            console.log(`  Blinds: ${smallBlindB52USDC}/${bigBlindB52USDC} uusdc (converted)`);

            console.log("📊 Final game parameters:");
            console.log(`  Game Type: ${gameOptions.type}`);
            console.log(`  Players: ${gameOptions.minPlayers}-${gameOptions.maxPlayers}`);
            console.log(`  Min Buy-in: ${minBuyInB52USDC} uusdc ($${gameOptions.minBuyIn})`);
            console.log(`  Max Buy-in: ${maxBuyInB52USDC} uusdc ($${gameOptions.maxBuyIn})`);
            console.log(`  Small Blind: ${smallBlindB52USDC} uusdc`);
            console.log(`  Big Blind: ${bigBlindB52USDC} uusdc`);

            console.log("🚀 Creating New Game on Cosmos Blockchain:");
            console.log(`Creator: ${userAddress}`);

            // Map GameType to string for Cosmos
            const gameTypeStr = gameOptions.type === GameType.SIT_AND_GO ? "sit_and_go" :
                gameOptions.type === GameType.TOURNAMENT ? "tournament" : "cash";

            // Timeout in seconds (5 minutes = 300 seconds)
            const timeoutSeconds = 300;

            // Call SigningCosmosClient.createGame()
            const txHash = await signingClient.createGame(
                gameTypeStr,
                gameOptions.minPlayers,
                gameOptions.maxPlayers,
                minBuyInB52USDC,
                maxBuyInB52USDC,
                smallBlindB52USDC,
                bigBlindB52USDC,
                timeoutSeconds
            );

            if (txHash) {
                console.log(`✅ Game creation transaction submitted: ${txHash}`);
                setNewGameId(txHash);

                // Note: The actual game ID will be returned in the transaction result
                // You may want to query the transaction to get the game ID from events
            }

            return txHash;
        } catch (err: any) {
            const errorMessage = err.message || "Failed to create game on blockchain";
            setError(new Error(errorMessage));
            console.error("❌ Error creating game:", err);
            return null;
        } finally {
            setIsCreating(false);
        }
    }, [currentNetwork]);

    return {
        createTable,
        isCreating,
        error,
        newGameId
    };
};