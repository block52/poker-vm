import { useState, useEffect, useCallback } from "react";
import { NodeRpcClient, GameOptionsResponse } from "@bitcoinbrisbane/block52";
import { FindGamesReturn } from "../types/index";
import { getPrivateKey } from "../utils/b52AccountUtils";

/**
 * Custom hook to find available games
 * @returns Object containing available games and loading state
 */
export const useFindGames = (): FindGamesReturn => {
    const [games, setGames] = useState<GameOptionsResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchGames = useCallback(async () => {
        // Get private key from storage
        const privateKey = getPrivateKey();
        if (!privateKey) {
            setError(new Error("No private key found. Please connect your wallet first."));
            return;
        }

        // Create the client directly with the private key
        const nodeUrl = import.meta.env.VITE_NODE_RPC_URL || "https://node1.block52.xyz/";
        const client = new NodeRpcClient(nodeUrl, privateKey);

        setIsLoading(true);
        setError(null);

        try {
            // WORKAROUND: The SDK's findGames has a bug where it returns [] if no params are passed
            // Instead, we'll make a direct RPC call with an empty query to get ALL games
            // The backend's FindGameStateCommand will return all games when query is empty
            
            // Make direct RPC call to bypass SDK's flawed logic
            const rpcUrl = import.meta.env.VITE_NODE_RPC_URL || "https://node1.block52.xyz/";
            const response = await fetch(rpcUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: Math.random().toString(36).substring(7),
                    method: "find_contract",
                    params: [null] // Pass null to trigger the "no filter" case in backend
                })
            });
            
            const data = await response.json();
            const availableGames: GameOptionsResponse[] = data.result?.data || [];
            
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
    }, []);

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
