import { useGameState } from "./useGameState";

/**
 * Custom hook to check if a game is in progress
 * @param tableId The ID of the table to check
 * @returns Object containing isGameInProgress flag and loading/error states
 */
export const useGameProgress = (tableId?: string) => {
  // Get game state from centralized hook
  const { gameState, isLoading, error } = useGameState(tableId);

  // Default values in case of error or loading
  const defaultState = {
    isGameInProgress: false,
    activePlayers: [],
    playerCount: 0,
    isLoading,
    error
  };

  // If still loading or error occurred, return default values
  if (isLoading || error || !gameState) {
    return defaultState;
  }

  try {
    if (!gameState.players) {
      console.warn("No players data found in API response");
      return defaultState;
    }

    // Filter for active players (not folded and not sitting out)
    const activePlayers = gameState.players.filter(
      (player: any) => player.status !== "folded" && player.status !== "sitting-out"
    );

    // Game is in progress if there are at least 2 active players
    const isGameInProgress = activePlayers.length > 1;
    
    return {
      isGameInProgress,
      activePlayers,
      playerCount: activePlayers.length,
      isLoading: false,
      error: null
    };
  } catch (err) {
    console.error("Error checking game progress:", err);
    return {
      ...defaultState,
      error: err
    };
  }
}; 