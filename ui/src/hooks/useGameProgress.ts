import { useGameState } from "./useGameState";
import { GameProgressType } from "../types/index";
import { TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook to check if a game is in progress and provide game status information
 * @param tableId The ID of the table to check
 * @returns Object containing:
 * - isGameInProgress: boolean indicating if a game is currently being played
 * - activePlayers: array of players who are not folded or sitting out
 * - playerCount: number of active players
 * - handNumber: current hand number in the game session
 * - actionCount: current action count in the hand
 * - nextToAct: seat number of the next player to act
 * - previousActions: array of previous actions in the current hand
 * - isLoading: boolean indicating if data is being loaded
 * - error: any error that occurred during data fetching
 * - refresh: function to manually refresh the game state
 */
export const useGameProgress = (tableId?: string): GameProgressType => {
  // Get game state from centralized hook
  const { gameState, isLoading, error, refresh: gameStateRefresh } = useGameState(tableId);
  
  // Throttled state to limit updates to once per second
  const [throttledGameState, setThrottledGameState] = useState<TexasHoldemStateDTO | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const throttleDelay = 1000; // 1 second throttle

  // Throttle game state updates
  useEffect(() => {
    if (!gameState) {
      setThrottledGameState(null);
      return;
    }

    const now = Date.now();
    if (now - lastUpdateTimeRef.current >= throttleDelay) {
      setThrottledGameState(gameState);
      lastUpdateTimeRef.current = now;
      
      // Debug logging only when state actually updates (throttled)
      console.log("Game State in useGameProgress (throttled):", {
        handNumber: gameState.handNumber,
        actionCount: gameState.actionCount,
        nextToAct: gameState.nextToAct,
        hasPlayers: !!gameState.players?.length
      });
    } else {
      // Schedule update after throttle delay
      const timeUntilNextUpdate = throttleDelay - (now - lastUpdateTimeRef.current);
      const timeoutId = setTimeout(() => {
        setThrottledGameState(gameState);
        lastUpdateTimeRef.current = Date.now();
      }, timeUntilNextUpdate);

      return () => clearTimeout(timeoutId);
    }
  }, [gameState]);

  // Wrap the refresh function to ensure correct return type
  const refresh = useCallback(async (): Promise<TexasHoldemStateDTO | undefined> => {
    return gameStateRefresh();
  }, [gameStateRefresh]);

  // Default values in case of error or loading
  const defaultState: GameProgressType = {
    isGameInProgress: false,
    activePlayers: [],
    playerCount: 0,
    handNumber: 0,
    actionCount: 0,
    nextToAct: 0,
    previousActions: [],
    isLoading,
    error,
    refresh
  };

  // If still loading or error occurred, return default values
  if (isLoading || error || !throttledGameState) {
    return defaultState;
  }

  try {
    if (!throttledGameState.players) {
      console.warn("No players data found in API response");
      return defaultState;
    }

    // Filter for active players (not folded and not sitting out)
    const activePlayers = throttledGameState.players.filter(
      (player: any) => player.status !== "folded" && player.status !== "sitting-out"
    );

    // Game is in progress if there are at least 2 active players
    const isGameInProgress = activePlayers.length > 1;
    
    // Extract values, checking different possible locations in the object structure
    const extractValue = (key: string): any => {
      // First check direct properties we know exist on TexasHoldemStateDTO
      if (key === "handNumber" && typeof throttledGameState.handNumber !== "undefined") {
        return throttledGameState.handNumber;
      }
      if (key === "actionCount" && typeof throttledGameState.actionCount !== "undefined") {
        return throttledGameState.actionCount;
      }
      if (key === "nextToAct" && typeof throttledGameState.nextToAct !== "undefined") {
        return throttledGameState.nextToAct;
      }
      if (key === "previousActions" && Array.isArray(throttledGameState.previousActions)) {
        return throttledGameState.previousActions;
      }
      
      // Then check if it's in data.result structure (using type assertion to avoid TS errors)
      const gameStateAny = throttledGameState as any;
      if (gameStateAny.result?.data && typeof gameStateAny.result.data[key] !== "undefined") {
        return gameStateAny.result.data[key];
      }
      
      // Default values based on key type
      if (key === "previousActions") return [];
      return 0;
    };
    
    return {
      isGameInProgress,
      activePlayers,
      playerCount: activePlayers.length,
      handNumber: extractValue("handNumber") || 0,
      actionCount: extractValue("actionCount") || 0,
      nextToAct: extractValue("nextToAct") || 0,
      previousActions: extractValue("previousActions") || [],
      isLoading: false,
      error: null,
      refresh
    };
  } catch (err) {
    console.error("Error checking game progress:", err);
    return {
      ...defaultState,
      error: err instanceof Error ? err : new Error(String(err))
    };
  }
}; 