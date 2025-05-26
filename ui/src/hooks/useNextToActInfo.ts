import { useGameState } from "./useGameState";
import { useCallback, useMemo } from "react";
import { PlayerDTO } from "@bitcoinbrisbane/block52";

// Define the nextToActInfo type
export interface NextToActInfo {
    seat: number;
    player: PlayerDTO;
    isCurrentUserTurn: boolean;
    availableActions: any[];
    timeRemaining: number;
}

/**
 * Determines who is next to act at the table
 * @param gameData Current game state data
 * @returns Object containing information about who is next to act
 */
export const whoIsNextToAct = (gameData: any): NextToActInfo | null => {
    if (!gameData || !gameData.players) return null;

    const nextToActSeat = gameData.nextToAct;
    if (nextToActSeat === undefined || nextToActSeat === null) return null;

    // Find the player who is next to act
    const player = gameData.players.find((p: any) => p.seat === nextToActSeat);
    if (!player) return null;

    // Check if it's the current user's turn
    const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();
    const isCurrentUserTurn = player.address?.toLowerCase() === userAddress;

    // Get available actions
    const availableActions = player.legalActions || [];

    // Calculate time remaining (if needed)
    const timeRemaining = player.timeout || 30; // Default to 30 seconds

    return {
        seat: nextToActSeat,
        player,
        isCurrentUserTurn,
        availableActions,
        timeRemaining
    };
};

/**
 * Custom hook to fetch and provide information about who is next to act
 * Uses real-time WebSocket data - no polling needed
 * @param tableId The ID of the table to fetch state for
 * @returns Object containing next-to-act information
 */
export const useNextToActInfo = (tableId?: string) => {
    // Get game state from centralized WebSocket hook
    const { gameState, isLoading, error, refresh } = useGameState(tableId);

    // Memoize the nextToActInfo calculation to avoid recomputing on every render
    const nextToActInfo = useMemo(() => {
        if (!gameState || isLoading || error) return null;

        try {
            // Special case: if dealer position is 9, treat it as 0 for UI purposes
            const gameStateCopy = { ...gameState };
            if (gameStateCopy.dealer === 9) {
                gameStateCopy.dealer = 0;
            }

            // Use the utility function to determine who is next to act
            return whoIsNextToAct(gameStateCopy);
        } catch (err) {
            console.error("Error parsing next-to-act info:", err);
            return null;
        }
    }, [gameState, isLoading, error]);

    // Memoize the manual refresh function to maintain reference equality
    const manualRefresh = useCallback(() => {
        return refresh();
    }, [refresh]);

    // Memoize the result object to prevent unnecessary re-renders in consuming components
    return useMemo(
        () => ({
            nextToActInfo,
            isLoading,
            error,
            refresh: manualRefresh
        }),
        [nextToActInfo, isLoading, error, manualRefresh]
    );
};
