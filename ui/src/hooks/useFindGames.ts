import { useState, useEffect, useCallback } from "react";
import { useNodeRpc } from "../context/NodeRpcContext";
import { FindGamesReturn } from "../types/index";
import { GameOptionsResponse } from "@bitcoinbrisbane/block52";

/**
 * Custom hook to find available games
 * @returns Object containing available games and loading state
 */
export const useFindGames = (): FindGamesReturn => {
    const [games, setGames] = useState<GameOptionsResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { client } = useNodeRpc();

    const fetchGames = useCallback(async () => {
        if (!client) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Use hardcoded min/max values as suggested
            const minBuyIn = BigInt("10000000000000000"); // 0.01 ETH
            const maxBuyIn = BigInt("1000000000000000000"); // 1 ETH
            
            const availableGames: GameOptionsResponse[] = await client.findGames(minBuyIn, maxBuyIn);
            console.log("Available games:", availableGames);
            // Also log stringified version for complete details
            console.log("Available games (stringified):", JSON.stringify(availableGames, null, 2));
            
            // Debug: Check for duplicate addresses
            const addresses = availableGames.map(game => game.address);
            const uniqueAddresses = Array.from(new Set(addresses));
            console.log("🔍 Address Analysis:");
            console.log("All addresses:", addresses);
            console.log("Unique addresses:", uniqueAddresses);
            console.log(`Total games: ${availableGames.length}, Unique addresses: ${uniqueAddresses.length}`);
            
            if (addresses.length !== uniqueAddresses.length) {
                console.warn("⚠️ DUPLICATE ADDRESSES DETECTED! Same table returned multiple times.");
                console.warn("This suggests either:");
                console.warn("1. Backend is returning the same table multiple times");
                console.warn("2. Table creation is not generating unique addresses");
                console.warn("3. Database has duplicate entries");
            }
            
            setGames(availableGames);
        } catch (err: any) {
            const errorMessage = err.message || "Failed to fetch games";
            setError(new Error(errorMessage));
            console.error("Error fetching games:", err);
        } finally {
            setIsLoading(false);
        }
    }, [client]);

    useEffect(() => {
        fetchGames();
    }, [fetchGames]);

    return {
        games,
        isLoading,
        error,
        refetch: fetchGames
    };
};
