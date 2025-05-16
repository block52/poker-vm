import { useState, useEffect } from "react";
import { useNodeRpc } from "../context/NodeRpcContext";
import { GameOptionsDTO } from "@bitcoinbrisbane/block52";

/**
 * Custom hook to find available games
 * @returns Object containing available games and loading state
 */
export const useFindGames = () => {
    const [games, setGames] = useState<GameOptionsDTO[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { client } = useNodeRpc();

    useEffect(() => {
        const fetchGames = async () => {
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
                setGames(availableGames);
            } catch (err: any) {
                setError(err.message || "Failed to fetch games");
                console.error("Error fetching games:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGames();
    }, [client]);

    return {
        games,
        isLoading,
        error
    };
};
