import { ethers } from "ethers";
import { useGameState } from "./useGameState";
import { WinnerDTO, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { formatWeiToDollars } from "../utils/numberUtils";

/**
 * Extract winner information from game state
 * @param gameData The parsed game data
 * @returns Array of winner information or null if no winners
 */
export function getWinnerInfo(gameData: any) {
  if (!gameData) return null;

  // Check for explicit winners array in the game data
  if (gameData.winners && gameData.winners.length > 0) {
    return gameData.winners.map((winner: WinnerDTO) => {
      // Get the player object for this winner to find their seat
      const player = gameData.players?.find(
        (p: any) => p.address?.toLowerCase() === winner.address?.toLowerCase()
      );

      return {
        seat: player?.seat || 0,
        address: winner.address,
        amount: winner.amount.toString(),
        formattedAmount: formatWeiToDollars(winner.amount.toString()),
        winType: "showdown"
      };
    });
  }

  // Check for "win by fold" scenario - when all players except one have folded
  const totalPlayersAtTable = gameData.players?.filter((p: any) => p).length || 0;

  // Only proceed with win detection if there are at least 2 players
  if (totalPlayersAtTable >= 2) {
    const activePlayers = gameData.players?.filter(
      (p: any) => p && p.status?.toLowerCase() !== "folded" && p.status?.toLowerCase() !== "inactive"
    ) || [];

    // Check if this is a real win-by-fold situation
    const hasHandStarted = gameData.round !== "waiting"; // Make sure game has started
    const somePlayersHaveFolded = gameData.players?.some((p: any) => p && p.status?.toLowerCase() === "folded");
    const hasPreviousActions = gameData.previousActions?.length > 0;

    // Only declare a winner if:
    // 1. Only one player remains active AND
    // 2. The hand has started AND
    // 3. Either some players folded OR there were previous actions
    if (activePlayers.length === 1 && hasHandStarted && (somePlayersHaveFolded || hasPreviousActions)) {
      // Calculate pot amount
      let potAmount = "0";
      if (gameData.pots && Array.isArray(gameData.pots)) {
        potAmount = gameData.pots.reduce((sum: string, pot: string) => {
          return (BigInt(sum) + BigInt(pot)).toString();
        }, "0");
      }

      const winner = {
        seat: activePlayers[0].seat,
        address: activePlayers[0].address,
        amount: potAmount,
        formattedAmount: formatWeiToDollars(potAmount),
        winType: "fold" // Add this to distinguish win by fold
      };

      return [winner];
    }
  }

  // No winners yet
  return null;
}

/**
 * Custom hook to fetch and provide winner information
 * @param tableId The ID of the table to fetch state for
 * @returns Object containing winner information
 */
export const useWinnerInfo = (tableId?: string) => {
  // Get game state from centralized hook
  const { gameState, isLoading, error, refresh } = useGameState(tableId);

  // Default values in case of error or loading
  const defaultState = {
    winnerInfo: null as {
      seat: number;
      address: string;
      amount: string | number;
      formattedAmount: string;
      winType?: string;
    }[] | null,
    isLoading,
    error,
    refresh
  };

  // If still loading or error occurred, return default values
  if (isLoading || error || !gameState) {
    return defaultState;
  }

  try {
    // Process winner information
    const winners = getWinnerInfo(gameState);

    if (winners && winners.length > 0) {
      console.log("🏆 Winners detected:", winners);
    }

    const result = {
      winnerInfo: winners,
      isLoading: false,
      error: null,
      refresh
    };

    console.log("[useWinnerInfo] Returns:", {
      hasWinners: !!winners && winners.length > 0,
      numWinners: winners?.length || 0,
      winnerSeats: winners?.map((w: {seat: number}) => w.seat) || [],
      isLoading: false,
      hasError: false
    });

    return result;
  } catch (err) {
    console.error("Error parsing winner information:", err);
    return {
      ...defaultState,
      error: err
    };
  }
};
