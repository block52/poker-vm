import { useState, useEffect } from "react";
import { useGameState } from "./useGameState";
import { PlayerStatus } from "@bitcoinbrisbane/block52";
import useSWR from "swr";

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
  const [lastRefresh, setLastRefresh] = useState(0);
  
  // Get game state from centralized hook
  const { gameState, isLoading, error, refresh } = useGameState(tableId);
  
  // Custom more frequent refresh for this critical hook - timer needs 1-second updates
  useSWR(
    tableId && playerIndex !== undefined ? `player-timer-${tableId}-${playerIndex}` : null,
    async () => {
      const now = Date.now();
      // Refresh if more than 1 second has elapsed
      if (now - lastRefresh >= 1000) {
        await refresh();
        setLastRefresh(now);
      }
      return null;
    },
    { refreshInterval: 1000, revalidateOnFocus: true }
  );

  // Update player status and timeout whenever data changes
  useEffect(() => {
    if (!isLoading && !error && gameState && playerIndex !== undefined) {
      try {
        if (!gameState.players || !gameState.players[playerIndex]) {
          return;
        }

        const player = gameState.players[playerIndex];
        
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
  }, [gameState, isLoading, error, playerIndex]);

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