import { useState, useEffect, useCallback } from "react";
import { CosmosClient, getDefaultCosmosConfig } from "@bitcoinbrisbane/block52";

interface UseCosmosGameStateReturn {
    gameState: any | null;
    gameInfo: any | null;
    legalActions: any[] | null;
    playerBalance: bigint | null; // b52USDC balance
    isLoading: boolean;
    error: string | null;
    refetchGameState: () => Promise<void>;
    performAction: (action: string, amountB52USDC?: bigint) => Promise<string>;
    joinGame: (seat: number, buyInB52USDC: bigint) => Promise<string>;
}

export const useCosmosGameState = (gameId: string, playerAddress?: string): UseCosmosGameStateReturn => {
    const [gameState, setGameState] = useState<any | null>(null);
    const [gameInfo, setGameInfo] = useState<any | null>(null);
    const [legalActions, setLegalActions] = useState<any[] | null>(null);
    const [playerBalance, setPlayerBalance] = useState<bigint | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [cosmosClient] = useState(() => new CosmosClient(getDefaultCosmosConfig()));

    const fetchGameState = useCallback(async () => {
        if (!gameId) return;

        setIsLoading(true);
        setError(null);

        try {
            // Fetch game state
            const state = await cosmosClient.getGameState(gameId);
            setGameState(state);

            // Fetch game info
            const info = await cosmosClient.getGame(gameId);
            setGameInfo(info);

            // Fetch legal actions and balance if player address is provided
            if (playerAddress) {
                const actions = await cosmosClient.getLegalActions(gameId, playerAddress);
                setLegalActions(actions);

                // Fetch b52USDC balance
                const balance = await cosmosClient.getB52USDCBalance(playerAddress);
                setPlayerBalance(balance);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
            setError(errorMessage);
            console.error("Error fetching game data:", err);
        } finally {
            setIsLoading(false);
        }
    }, [gameId, playerAddress, cosmosClient]);

    const performAction = useCallback(async (action: string, amountB52USDC: bigint = 0n): Promise<string> => {
        try {
            setError(null);
            const txHash = await cosmosClient.performAction(gameId, action, amountB52USDC);

            // Refetch game state after action
            setTimeout(() => {
                fetchGameState();
            }, 2000);

            return txHash;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Action failed";
            setError(errorMessage);
            throw err;
        }
    }, [gameId, cosmosClient, fetchGameState]);

    const joinGame = useCallback(async (seat: number, buyInB52USDC: bigint): Promise<string> => {
        try {
            setError(null);
            const txHash = await cosmosClient.joinGame(gameId, seat, buyInB52USDC);

            // Refetch game state after joining
            setTimeout(() => {
                fetchGameState();
            }, 2000);

            return txHash;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Join game failed";
            setError(errorMessage);
            throw err;
        }
    }, [gameId, cosmosClient, fetchGameState]);

    // Fetch data on mount and when dependencies change
    useEffect(() => {
        fetchGameState();
    }, [fetchGameState]);

    // Set up polling for real-time updates
    useEffect(() => {
        if (!gameId) return;

        const interval = setInterval(() => {
            fetchGameState();
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [fetchGameState]);

    return {
        gameState,
        gameInfo,
        legalActions,
        playerBalance,
        isLoading,
        error,
        refetchGameState: fetchGameState,
        performAction,
        joinGame,
    };
};