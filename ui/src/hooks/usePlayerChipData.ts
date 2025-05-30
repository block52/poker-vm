import { PlayerChipDataReturn } from "../types/index";
import { PlayerDTO } from "@bitcoinbrisbane/block52";
import { useGameStateContext } from "../context/GameStateContext";

/**
 * Custom hook to fetch and provide player chip data for each seat
 * 
 * SIMPLIFIED: Uses GameStateContext directly instead of useGameState
 * This prevents creating multiple WebSocket connections for the same table
 * 
 * @param tableId The ID of the table (not used - Context manages subscription)
 * @returns Object containing player chip data mapped by seat
 */
export const usePlayerChipData = (tableId?: string): PlayerChipDataReturn => {
  // Get game state directly from Context - no additional WebSocket connections
  const { gameState, isLoading, error } = useGameStateContext();

  // Default values in case of error or loading
  const defaultState: PlayerChipDataReturn = {
    getChipAmount: (seatIndex: number): string => "0",
    isLoading,
    error
  };

  // If still loading or error occurred, return default values
  if (isLoading || error || !gameState) {
    return defaultState;
  }

  try {
    if (!gameState.players || !Array.isArray(gameState.players)) {
      console.warn("No players data found in API response");
      return defaultState;
    }

    // Function to get chip amount for a given seat
    const getChipAmount = (seatIndex: number): string => {
      const player = gameState.players.find((p: PlayerDTO) => p && p.seat === seatIndex);
      if (player && player.stack) {
        return player.stack; // Return the raw stack amount as string (in Wei)
      }
      return "0"; // Return "0" if no player or chips data found
    };
    
    return {
      getChipAmount,
      isLoading: false,
      error: null
    };
  } catch (err) {
    console.error("Error parsing player chip data:", err);
    return {
      ...defaultState,
      error: err instanceof Error ? err : new Error("Error parsing player chip data")
    };
  }
}; 