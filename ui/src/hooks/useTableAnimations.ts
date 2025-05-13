import { useGameState } from "./useGameState"
import { useMemo } from "react";

/**
 * Custom hook to provide table animation-related information
 * @param tableId The ID of the table to fetch state for
 * @returns Object containing table animation properties such as tableSize
 */
export const useTableAnimations = (tableId?: string) => {
  // Get game state from centralized hook
  const { gameState, isLoading, error } = useGameState(tableId);

  // Default value for tableSize - define outside useMemo to avoid recalculation
  const defaultTableSize = 9;

  // Memoize the result to prevent unnecessary recalculations
  return useMemo(() => {
    // If still loading or error occurred, return default values
    if (isLoading || error || !gameState) {
      return {
        tableSize: defaultTableSize,
        isLoading,
        error
      };
    }

    try {
      // Extract table size (maximum players) from game options
      const tableSize = gameState.gameOptions?.maxPlayers || 
                        gameState.gameOptions?.minPlayers || 
                        defaultTableSize;
      
      return {
        tableSize,
        isLoading: false,
        error: null
      };
    } catch (err) {
      console.error("Error parsing table animations data:", err);
      return {
        tableSize: defaultTableSize,
        isLoading: false,
        error: err
      };
    }
  }, [gameState, isLoading, error]); // Only recalculate when these dependencies change
}; 