import { useState, useEffect, useCallback } from "react";
import { useNodeRpc } from "../context/NodeRpcContext";
import { GameWithAddress, FindGamesReturn } from "../types/index";

/**
 * Custom hook to find available games
 * @returns Object containing available games and loading state
 */
export const useFindGames = (): FindGamesReturn => {
    const [games, setGames] = useState<GameWithAddress[]>([]);
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
            
            const availableGames = await client.findGames(minBuyIn, maxBuyIn);
            console.log("Available games:", availableGames);
            // Also log stringified version for complete details
            console.log("Available games (stringified):", JSON.stringify(availableGames, null, 2));
            setGames(availableGames as GameWithAddress[]);
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
