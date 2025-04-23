import { useState, useEffect } from "react";
import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { PlayerStatus } from "@bitcoinbrisbane/block52";

// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => res.data);

/**
 * Custom hook to manage player timer information
 * @param tableId The ID of the table
 * @param playerIndex The index of the player to check
 * @returns Object containing player status and timer information
 */
export const usePlayerTimer = (tableId?: string, playerIndex?: number) => {
  const [progress, setProgress] = useState(0);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>(PlayerStatus.NOT_ACTED);
  const [timeoutValue, setTimeoutValue] = useState(30); // Default to 30 seconds
  
  // Fetch table data using SWR
  const { data, error, isLoading } = useSWR(
    tableId ? `${PROXY_URL}/get_game_state/${tableId}` : null,
    fetcher,
    {
      refreshInterval: 1000, // Refresh every second for timer accuracy
      revalidateOnFocus: true
    }
  );

  // Update player status and timeout whenever data changes
  useEffect(() => {
    if (!isLoading && !error && data && playerIndex !== undefined) {
      try {
        const gameData = data.data || data;
        
        if (!gameData || !gameData.players || !gameData.players[playerIndex]) {
          return;
        }

        const player = gameData.players[playerIndex];
        
        // Update status
        if (player.status) {
          setPlayerStatus(player.status.toLowerCase() as PlayerStatus);
        }
        
        // Update timeout - use the player's timeout or default to 30
        const timeout = player.timeout !== undefined ? player.timeout : 30;
        setTimeoutValue(timeout);
        
        // Reset progress when player changes or status changes
        setProgress(0);
      } catch (err) {
        console.error("Error getting player timer info:", err);
      }
    }
  }, [data, isLoading, error, playerIndex]);

  // Handle timer progression
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (playerStatus === PlayerStatus.ACTIVE) {
      setProgress(0); // Reset progress when "thinking" starts

      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= timeoutValue) {
            clearInterval(interval!); // Stop progress
            return prev;
          }
          return prev + 1; // Increment progress
        });
      }, 1000); // Update every second
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [playerStatus, timeoutValue]);

  const result = {
    playerStatus,
    timeoutValue,
    progress,
    timeRemaining: Math.max(0, timeoutValue - progress),
    isActive: playerStatus === PlayerStatus.ACTIVE,
    isLoading,
    error
  };

  console.log("[usePlayerTimer] Returns:", {
    playerIndex,
    playerStatus: result.playerStatus,
    timeoutValue: result.timeoutValue,
    progress: result.progress,
    timeRemaining: result.timeRemaining,
    isActive: result.isActive,
    isLoading: result.isLoading,
    hasError: !!result.error
  });

  return result;
}; 