import { useMemo } from "react";
import { useGameState } from "./useGameState";
import { TableAnimationsReturn, GameStateReturn } from "../types/index";

/**
 * Custom hook to provide table animation-related information
 * @param tableId The ID of the table to fetch state for
 * @returns Object containing table animation properties such as tableSize
 */
export const useTableAnimations = (tableId?: string): TableAnimationsReturn => {
  // Get game state from centralized hook
  const { gameState, isLoading, error }: GameStateReturn = useGameState(tableId);

  // Memoize the table size calculation
  const tableSize = useMemo((): number => {
    const defaultTableSize = 9;
    
    if (!gameState?.gameOptions) {
      return defaultTableSize;
    }

    try {
      // Extract table size (maximum players) from game options
      return gameState.gameOptions.maxPlayers || 
             gameState.gameOptions.minPlayers || 
             defaultTableSize;
    } catch (err) {
      console.error("Error parsing table size from game options:", err);
      return defaultTableSize;
    }
  }, [gameState]);

  return {
    tableSize,
    isLoading,
    error
  };
}; 