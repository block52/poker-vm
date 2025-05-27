import { useGameState } from "./useGameState";
import { PlayerChipDataReturn, GameStateReturn } from "../types/index";
import { PlayerDTO } from "@bitcoinbrisbane/block52";

/**
 * Custom hook to fetch and provide player chip data for each seat
 * @param tableId The ID of the table to fetch data for
 * @returns Object containing player chip data mapped by seat
 */
export const usePlayerChipData = (tableId?: string): PlayerChipDataReturn => {
  // Get game state from centralized hook
  const { gameState, isLoading, error }: GameStateReturn = useGameState(tableId);

  // Default values in case of error or loading
  const defaultState: PlayerChipDataReturn = {
    getChipAmount: (seatIndex: number): number => 0,
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
    const getChipAmount = (seatIndex: number): number => {
      const player = gameState.players.find((p: PlayerDTO) => p && p.seat === seatIndex);
      if (player && player.stack) {
        return Number(player.stack); // Return the stack amount for the player
      }
      return 0; // Return 0 if no player or chips data found
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