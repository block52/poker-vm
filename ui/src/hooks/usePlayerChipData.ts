import { useGameState } from "./useGameState";
import { formatWeiToDollars } from "../utils/numberUtils";

/**
 * Custom hook to fetch and provide player chip data for each seat
 * @param tableId The ID of the table to fetch data for
 * @returns Object containing player chip data mapped by seat
 */
export const usePlayerChipData = (tableId?: string) => {
  // Get game state from centralized hook
  const { gameState, isLoading, error } = useGameState(tableId);

  // Default values in case of error or loading
  const defaultState = {
    chipDataBySeat: {},
    getChipAmount: (seatIndex: number): number => 0,
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

    // Create a map of player chip data by seat
    const chipDataBySeat = gameState.players.reduce((acc: any, player: any) => {
      if (player && player.seat !== undefined) {
        acc[player.seat] = {
          stack: player.stack || "0",
          sumOfBets: player.sumOfBets || "0",
          formattedSumOfBets: formatWeiToDollars(player.sumOfBets || "0")
        };
      }
      return acc;
    }, {});

    // Function to get chip amount for a given seat
    const getChipAmount = (seatIndex: number): number => {
      const playerData = chipDataBySeat[seatIndex];
      if (!playerData) return 0;
      return parseFloat(formatWeiToDollars(playerData.sumOfBets));
    };
    
    return {
      chipDataBySeat,
      getChipAmount,
      isLoading: false,
      error: null
    };
  } catch (err) {
    console.error("Error parsing player chip data:", err);
    return {
      ...defaultState,
      error: err
    };
  }
}; 