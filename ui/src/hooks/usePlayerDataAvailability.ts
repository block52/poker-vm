import { useGameState } from "./useGameState";

/**
 * Custom hook to check if player data is available
 * @param tableId The ID of the table to check
 * @returns Object containing availability flag and loading/error states
 */
export const usePlayerDataAvailability = (tableId?: string) => {
  // Get game state from centralized hook
  const { gameState, isLoading, error } = useGameState(tableId);

  // Default values in case of error or loading
  const defaultState = {
    isPlayerDataAvailable: false,
    playersCount: 0,
    isLoading,
    error
  };

  // If still loading or error occurred, return default values
  if (isLoading || error || !gameState) {
    return defaultState;
  }

  try {
    // Check if players array exists and has content
    const isPlayerDataAvailable = !!gameState?.players && Array.isArray(gameState.players);
    const playersCount = isPlayerDataAvailable ? gameState.players.length : 0;
    
    return {
      isPlayerDataAvailable,
      playersCount,
      isLoading: false,
      error: null
    };
  } catch (err) {
    console.error("Error checking player data availability:", err);
    return {
      ...defaultState,
      error: err
    };
  }
}; 