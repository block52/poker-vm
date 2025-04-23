import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { useCallback, useEffect, useState } from "react";
import { PlayerDTO } from "@bitcoinbrisbane/block52";

// Define the nextToActInfo type
export interface NextToActInfo {
  seat: number;
  player: PlayerDTO;
  isCurrentUserTurn: boolean;
  availableActions: any[];
  timeRemaining: number;
}

// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => res.data);

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

  // Skip the request if no tableId is provided
  const { data, error, isLoading, mutate } = useSWR(
    tableId ? `${PROXY_URL}/get_game_state/${tableId}` : null,
    fetcher,
    {
      // Refresh every 3 seconds and when window is focused
      refreshInterval: 3000,
      revalidateOnFocus: true
    }
  );

  // Process the data whenever it changes
  useEffect(() => {
    if (!isLoading && !error && data) {
      try {
        // Extract game data from the response
        const gameData = data.data || data;
        
        if (!gameData) {
          console.warn("No game data found in API response");
          return;
        }

        // Special case: if dealer position is 9, treat it as 0 for UI purposes
        if (gameData.dealer === 9) {
          gameData.dealer = 0;
        }

        // Use the utility function to determine who is next to act
        const nextToActData = whoIsNextToAct(gameData);
        setNextToActInfo(nextToActData);
      } catch (err) {
        console.error("Error parsing next-to-act info:", err);
      }
    }
  }, [data, isLoading, error]);

  // Manual refresh function
  const refresh = useCallback(() => {
    return mutate();
  }, [mutate]);

  const result = {
    nextToActInfo,
    isLoading,
    error,
    refresh
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