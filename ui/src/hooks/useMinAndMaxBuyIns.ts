import { useCallback } from "react";
import { useGameStateContext } from "../context/GameStateContext";
import { MinAndMaxBuyInsReturn } from "../types/index";

/**
 * Custom hook to fetch min and max buy-in values for a table
 * @param tableId The table ID (not used - Context manages subscription)
 * @returns Object containing min/max buy-in values in wei
 */
export const useMinAndMaxBuyIns = (tableId?: string): MinAndMaxBuyInsReturn => {
  // Get game state directly from Context - no additional WebSocket connections
  const { gameState, isLoading, error } = useGameStateContext();

  // Manual refresh function (no-op since WebSocket provides real-time data)
  const refresh = useCallback(async () => {
    console.log("Refresh called - WebSocket provides real-time data, no manual refresh needed");
  }, []);

  // Default values in case of error or loading
  const defaultValues: MinAndMaxBuyInsReturn = {
    minBuyInWei: "10000000000000000", // 0.01 ETH
    maxBuyInWei: "1000000000000000000", // 1 ETH
    isLoading,
    error,
    refresh
  };

  // If still loading or error occurred, return default values
  if (isLoading || error || !gameState) {
    return defaultValues;
  }

  try {
    // Extract game options from the game state
    const gameOptions = gameState.gameOptions;
    
    if (!gameOptions) {
      console.warn("No game options found in game state");
      return defaultValues;
    }

    // Get min and max buy-in values
    const minBuyInWei = gameOptions.minBuyIn || defaultValues.minBuyInWei;
    const maxBuyInWei = gameOptions.maxBuyIn || defaultValues.maxBuyInWei;

    const result: MinAndMaxBuyInsReturn = {
      minBuyInWei,
      maxBuyInWei,
      isLoading: false,
      error: null,
      refresh
    };

    return result;
  } catch (err) {
    console.error("Error parsing buy-in values:", err);
    return {
      ...defaultValues,
      error: err instanceof Error ? err : new Error("Error parsing buy-in values")
    };
  }
};
