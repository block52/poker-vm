import { ethers } from "ethers";
import { useGameState } from "./useGameState";
import { MinAndMaxBuyInsReturn, GameStateReturn } from "../types/index";

/**
 * Custom hook to fetch min and max buy-in values for a table
 * @param tableId The table ID to fetch limits for
 * @returns Object containing min/max buy-in values in both wei and formatted values
 */
export const useMinAndMaxBuyIns = (tableId?: string): MinAndMaxBuyInsReturn => {
  // Get game state from centralized hook
  const { gameState, isLoading, error }: GameStateReturn = useGameState(tableId);

  // Default values in case of error or loading
  const defaultValues: MinAndMaxBuyInsReturn = {
    minBuyInWei: "10000000000000000", // 0.01 ETH
    maxBuyInWei: "1000000000000000000", // 1 ETH
    minBuyInFormatted: "0.01",
    maxBuyInFormatted: "1.0",
    isLoading,
    error,
    refresh: async () => {} // Will be replaced below
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

    // Format values to human-readable form
    const minBuyInFormatted = Number(ethers.formatUnits(minBuyInWei, 18)).toFixed(2);
    const maxBuyInFormatted = Number(ethers.formatUnits(maxBuyInWei, 18)).toFixed(2);

    const result: MinAndMaxBuyInsReturn = {
      minBuyInWei,
      maxBuyInWei,
      minBuyInFormatted,
      maxBuyInFormatted,
      isLoading: false,
      error: null,
      refresh: async () => {} // No longer needed since useGameState handles refreshing
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
