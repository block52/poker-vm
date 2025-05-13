import { useGameState } from "./useGameState";
import { PlayerDTO, PlayerStatus, ActionDTO, LegalActionDTO } from "@bitcoinbrisbane/block52";

/**
 * Extracts the player data from the API response
 * @param data The raw API response data
 * @returns Array of PlayerDTO objects or null if data is invalid
 */
function extractPlayerData(data: any): PlayerDTO[] | null {
  if (!data) return null;

  // Check if data has the expected structure
  if (data.result?.data?.players) {
    return data.result.data.players;
  } else if (data.data?.players) {
    return data.data.players;
  } else if (data.players) {
    return data.players;
  }

  console.warn("Unable to find player data in API response:", data);
  return null;
}

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