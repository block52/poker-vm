import { useGameState } from "./useGameState";
import { useCallback, useEffect, useState } from "react";
import { PlayerDTO } from "@bitcoinbrisbane/block52";
import useSWR from "swr";

// Define the nextToActInfo type
export interface NextToActInfo {
  seat: number;
  player: PlayerDTO;
  isCurrentUserTurn: boolean;
  availableActions: any[];
  timeRemaining: number;
}

/**
 * Determines who is next to act at the table
 * @param gameData Current game state data
 * @returns Object containing information about who is next to act
 */
export function whoIsNextToAct(gameData: any): NextToActInfo | null {
  if (!gameData || !gameData.players) return null;

  const nextToActSeat = gameData.nextToAct;
  if (nextToActSeat === undefined || nextToActSeat === null) return null;

  // Find the player who is next to act
  const player = gameData.players.find((p: any) => p.seat === nextToActSeat);
  if (!player) return null;

  // Check if it's the current user's turn
  const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();
  const isCurrentUserTurn = player.address?.toLowerCase() === userAddress;

  // Get available actions
  const availableActions = player.legalActions || [];

  // Calculate time remaining (if needed)
  const timeRemaining = player.timeout || 30; // Default to 30 seconds

  return {
    seat: nextToActSeat,
    player,
    isCurrentUserTurn,
    availableActions,
    timeRemaining
  };
}

/**
 * Custom hook to fetch and provide information about who is next to act
 * @param tableId The ID of the table to fetch state for
 * @returns Object containing next-to-act information
 */
export const useNextToActInfo = (tableId?: string) => {
  const [nextToActInfo, setNextToActInfo] = useState<NextToActInfo | null>(null);
  const [lastRefresh, setLastRefresh] = useState(0);

  // Get game state from centralized hook
  const { gameState, isLoading, error, refresh } = useGameState(tableId);

  // Custom more frequent refresh for this critical hook
  useSWR(
    tableId ? `next-to-act-${tableId}` : null,
    async () => {
      const now = Date.now();
      // Refresh if more than 3 seconds have elapsed
      if (now - lastRefresh >= 3000) {
        await refresh();
        setLastRefresh(now);
      }
      return null;
    },
    { refreshInterval: 3000, revalidateOnFocus: true }
  );

  // Process the data whenever it changes
  useEffect(() => {
    if (!isLoading && !error && gameState) {
      try {
        // Special case: if dealer position is 9, treat it as 0 for UI purposes
        if (gameState.dealer === 9) {
          gameState.dealer = 0;
        }

        // Use the utility function to determine who is next to act
        const nextToActData = whoIsNextToAct(gameState);
        setNextToActInfo(nextToActData);
      } catch (err) {
        console.error("Error parsing next-to-act info:", err);
      }
    }
  }, [gameState, isLoading, error]);

  // Manual refresh function
  const manualRefresh = useCallback(() => {
    return refresh();
  }, [refresh]);

  const result = {
    nextToActInfo,
    isLoading,
    error,
    refresh: manualRefresh
  };

  console.log("[useNextToActInfo] Returns:", {
    nextToActSeat: nextToActInfo?.seat,
    playerAddress: nextToActInfo?.player?.address,
    isCurrentUserTurn: nextToActInfo?.isCurrentUserTurn,
    numAvailableActions: nextToActInfo?.availableActions?.length,
    timeRemaining: nextToActInfo?.timeRemaining,
    isLoading,
    hasError: !!error
  });

  return result;
}; 