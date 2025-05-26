import { useGameState } from "./useGameState";
import { GameProgressType } from "../types/index";
import { TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { useCallback } from "react";

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
  // Get game state from centralized hook - no throttling, direct stream
  const { gameState, isLoading, error, refresh: gameStateRefresh } = useGameState(tableId);

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
  if (isLoading || error || !gameState) {
    return defaultState;
  }

  try {
    if (!gameState.players) {
      console.warn("No players data found in API response");
      return defaultState;
    }

    // Filter for active players (not folded and not sitting out)
    const activePlayers = gameState.players.filter(
      (player: any) => player.status !== "folded" && player.status !== "sitting-out"
    );

    // Game is in progress if there are at least 2 active players
    const isGameInProgress = activePlayers.length > 1;
    
    // Extract values, checking different possible locations in the object structure
    const extractValue = (key: string): any => {
      // First check direct properties we know exist on TexasHoldemStateDTO
      if (key === "handNumber" && typeof gameState.handNumber !== "undefined") {
        return gameState.handNumber;
      }
      if (key === "actionCount" && typeof gameState.actionCount !== "undefined") {
        return gameState.actionCount;
      }
      if (key === "nextToAct" && typeof gameState.nextToAct !== "undefined") {
        return gameState.nextToAct;
      }
      if (key === "previousActions" && Array.isArray(gameState.previousActions)) {
        return gameState.previousActions;
      }
      
      // Then check if it's in data.result structure (using type assertion to avoid TS errors)
      const gameStateAny = gameState as any;
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