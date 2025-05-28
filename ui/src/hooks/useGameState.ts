import { useEffect, useCallback, useRef } from "react";
import { TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { GameStateReturn } from "../types/index";
import { useGameStateContext } from "../context/GameStateContext";

/**
 * Central hook for fetching game state data via WebSocket subscription
 * This hook now uses the GameStateContext for centralized WebSocket management
 * @param tableId The ID of the table to fetch state for
 * @param autoRefreshIntervalMs Deprecated - WebSocket provides real-time updates
 * @returns Object containing game state data and utilities
 */
export const useGameState = (tableId?: string, autoRefreshIntervalMs: number = 10000): GameStateReturn => {
  const { gameState, isLoading, error, subscribeToTable, unsubscribeFromTable } = useGameStateContext();
  const lastTableIdRef = useRef<string | undefined>(undefined);

  // Subscribe to table when tableId changes
  useEffect(() => {
    // Only subscribe if tableId actually changed
    if (tableId && tableId !== lastTableIdRef.current) {
      console.log(`[useGameState] Table changed from ${lastTableIdRef.current} to ${tableId}`);
      lastTableIdRef.current = tableId;
      subscribeToTable(tableId);
    } else if (!tableId && lastTableIdRef.current) {
      console.log("[useGameState] No tableId provided, unsubscribing");
      lastTableIdRef.current = undefined;
      unsubscribeFromTable();
    }
  }, [tableId, subscribeToTable, unsubscribeFromTable]);

  // Manual refresh function (no-op since WebSocket provides real-time data)
  const refresh = useCallback(async (): Promise<TexasHoldemStateDTO | undefined> => {
    console.log("Refresh called - WebSocket provides real-time data, no manual refresh needed");
    return gameState;
  }, [gameState]);
  
  return { 
    gameState, 
    error, 
    isLoading, 
    refresh,
    // Helper function to safely extract nested properties
    getNestedValue: (path: string) => {
      if (!gameState) return undefined;
      
      return path.split(".").reduce((obj: any, key: string) => 
        (obj && obj[key] !== undefined) ? obj[key] : undefined, 
        gameState
      );
    }
  };
}; 