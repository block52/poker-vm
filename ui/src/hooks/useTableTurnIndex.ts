import { useGameState } from "./useGameState";

/**
 * Custom hook to get the next turn index for actions at a table
 * @param tableId The table ID
 * @returns The next turn index to use for actions
 */
export function useTableTurnIndex(tableId?: string): number {
  // Get game state from centralized hook
  const { gameState, error } = useGameState(tableId);

  // Handle loading and error states
  if (error) {
    console.error("Error loading game state for turn index:", error);
    return 0; // Default to 0 if there's an error
  }
  
  if (!gameState) {
    console.log("No data received from API for turn index");
    return 0; // Default to 0 if there's no data
  }

  try {
    // Get the previousActions array
    const previousActions = gameState.previousActions || [];
    
    if (previousActions.length === 0) {
      console.log("No previous actions found, returning index 0");
      return 0; // If no previous actions, start with index 0
    }
    
    // Sort actions by index to ensure we get the highest one
    // This is in case they're not already sorted
    const sortedActions = [...previousActions].sort((a, b) => a.index - b.index);
    
    // Get the latest action (highest index)
    const latestAction = sortedActions[sortedActions.length - 1];
    
    // The next index is the latest index + 1
    const nextIndex = latestAction.index + 1;
    console.log(`Latest action index: ${latestAction.index}, next index: ${nextIndex}`);
    
    console.log("[useTableTurnIndex] Returns:", nextIndex);
    
    return nextIndex;
  } catch (err) {
    console.error("Error calculating next turn index:", err);
    return 0; // Default to 0 if there's an error
  }
} 