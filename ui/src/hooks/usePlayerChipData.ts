import { useMemo } from "react";
import { PlayerChipDataReturn } from "../types/index";
import { useGameStateContext } from "../context/GameStateContext";

/**
 * Custom hook to fetch and provide player chip data for each seat
 *
 * SIMPLIFIED: Uses the sumOfBets value directly from PlayerDTO instead of calculating
 * This prevents complex logic and just uses what the backend already provides
 *
 * @param tableId The ID of the table (not used - Context manages subscription)
 * @returns Object containing player chip data mapped by seat
 */
export const usePlayerChipData = (): PlayerChipDataReturn => {
    // Get game state directly from Context - no additional WebSocket connections
    const { gameState, isLoading, error } = useGameStateContext();

    // Memoized calculation of all player chip amounts using sumOfBets from backend
    const playerChipAmounts = useMemo(() => {
        const amounts: Record<number, string> = {};
        
        // Handle loading, error, or invalid game state
        if (!gameState || !gameState.players || !Array.isArray(gameState.players)) {
            return amounts; // Return empty object for all invalid states
        }

        // Simply map each player's sumOfBets to their seat - no complex calculations needed
        gameState.players.forEach(player => {
            if (!player.seat || !player.address) return;
            
            // Use the sumOfBets value directly from the backend
            amounts[player.seat] = player.sumOfBets || "0";
        });
        
        return amounts;
    }, [gameState]);

    // Simplified function to get chip amount for a given seat
    const getChipAmount = (seatIndex: number): string => {
        // Input validation
        if (!Number.isInteger(seatIndex) || seatIndex < 1) {
            console.warn(`[usePlayerChipData] Invalid seat index: ${seatIndex}`);
            return "0";
        }
        
        // Return cached value - use sumOfBets directly from backend
        return playerChipAmounts[seatIndex] || "0";
    };

    // Default values in case of error or loading
    const defaultState: PlayerChipDataReturn = {
        getChipAmount: (seatIndex: number): string => "0",
        isLoading,
        error
    };

    // Early return only for loading/error states
    if (isLoading || error) {
        return defaultState;
    }

    return {
        getChipAmount,
        isLoading: false,
        error: null
    };
};