import { useGameState } from "./useGameState"

/**
 * Custom hook to provide table animation-related information
 * @param tableId The ID of the table to fetch state for
 * @returns Object containing table animation properties such as tableSize
 */
export const useTableAnimations = (tableId?: string) => {
  // Get game state from centralized hook
  const { gameState, isLoading, error } = useGameState(tableId);

  // Default value for tableSize
  const defaultTableSize = 9;

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
    const tableSize = gameState.gameOptions?.maxPlayers || gameState.gameOptions?.minPlayers || defaultTableSize;
    
    const result = {
      tableSize,
      isLoading: false,
      error: null
    };

    console.log("[useTableAnimations] Returns:", {
      tableSize: result.tableSize,
      isLoading: result.isLoading,
      hasError: !!result.error
    });

    return result;
  } catch (err) {
    console.error("Error parsing table animations data:", err);
    return {
      tableSize: defaultTableSize,
      isLoading: false,
      error: err
    };
  }
}; 