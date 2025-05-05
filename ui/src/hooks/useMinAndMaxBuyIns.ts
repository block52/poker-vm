import { ethers } from "ethers";
import { useGameState } from "./useGameState";

/**
 * Custom hook to fetch min and max buy-in values for a table
 * Uses the central useGameState hook to avoid multiple requests
 * @param tableId The table ID to fetch limits for
 * @returns Object containing min/max buy-in values in both wei and formatted values
 */
export const useMinAndMaxBuyIns = (tableId?: string) => {
  // Use the central gameState hook instead of making a separate request
  const { gameState, isLoading, error, refresh } = useGameState(tableId, 30000);

  // Default values in case of error or loading
  const defaultValues = {
    minBuyInWei: "10000000000000000", // 0.01 ETH
    maxBuyInWei: "1000000000000000000", // 1 ETH
    minBuyInFormatted: "0.01",
    maxBuyInFormatted: "1.0",
    isLoading,
    error,
    refresh
  };

  // If still loading or error occurred, return default values
  if (isLoading || error || !gameState) {
    return defaultValues;
  }

  try {
    // Extract game options from the data
    const gameOptions = gameState.gameOptions;
    
    if (!gameOptions) {
      console.warn("No game options found in table data");
      return defaultValues;
    }

    // Get min and max buy-in values
    const minBuyInWei = gameOptions.minBuyIn || defaultValues.minBuyInWei;
    const maxBuyInWei = gameOptions.maxBuyIn || defaultValues.maxBuyInWei;

    // Format values to human-readable form
    const minBuyInFormatted = Number(ethers.formatUnits(minBuyInWei, 18)).toFixed(2);
    const maxBuyInFormatted = Number(ethers.formatUnits(maxBuyInWei, 18)).toFixed(2);

    const result = {
      minBuyInWei,
      maxBuyInWei,
      minBuyInFormatted,
      maxBuyInFormatted,
      isLoading,
      error,
      refresh
    };

    console.log("[useMinAndMaxBuyIns] Returns:", {
      minBuyInWei,
      maxBuyInWei,
      minBuyInFormatted,
      maxBuyInFormatted,
      isLoading,
      hasError: !!error
    });

    return result;
  } catch (err) {
    console.error("Error parsing buy-in values:", err);
    return defaultValues;
  }
};
