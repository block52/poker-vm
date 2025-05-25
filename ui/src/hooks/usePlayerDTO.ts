import { useGameState } from "./useGameState";

/**
 * Custom hook to fetch and provide player data from the table
 * @param tableId The ID of the table to fetch player data for
 * @returns Object containing players array and loading state
 */
export function usePlayerDTO(tableId?: string) {
  // Get game state from centralized hook
  const { gameState, isLoading, error, refresh } = useGameState(tableId);

  // Extract player data directly
  const players = gameState?.players || null;

  const result = {
    players,
    isLoading,
    error,
    refresh
  };

  return result;
} 