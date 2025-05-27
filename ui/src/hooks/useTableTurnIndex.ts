import { useMemo } from "react";
import { useGameState } from "./useGameState";
import { TableTurnIndexReturn, GameStateReturn } from "../types/index";

/**
 * Custom hook to get the next turn index for actions at a table
 * @param tableId The table ID
 * @returns Object containing the next turn index and loading/error states
 */
export function useTableTurnIndex(tableId?: string): TableTurnIndexReturn {
  // Get game state from centralized hook
  const { gameState, isLoading, error }: GameStateReturn = useGameState(tableId);

  // Memoize the next turn index calculation
  const nextTurnIndex = useMemo((): number => {
    if (!gameState) {
      return 0; // Default to 0 if there's no data
    }

    try {
      // Get the previousActions array
      const previousActions = gameState.previousActions || [];
      
      if (previousActions.length === 0) {
        return 0; // If no previous actions, start with index 0
      }
      
      // Sort actions by index to ensure we get the highest one
      // This is in case they're not already sorted
      const sortedActions = [...previousActions].sort((a, b) => a.index - b.index);
      
      // Get the latest action (highest index)
      const latestAction = sortedActions[sortedActions.length - 1];
      
      // The next index is the latest index + 1
      return latestAction.index + 1;
    } catch (err) {
      console.error("Error calculating next turn index:", err);
      return 0; // Default to 0 if there's an error
    }
  }, [gameState]);

  return {
    nextTurnIndex,
    isLoading,
    error
  };
} 