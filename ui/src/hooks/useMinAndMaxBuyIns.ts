import { useGameStateContext } from "../context/GameStateContext";
import { MinAndMaxBuyInsReturn } from "../types/index";

/**
 * Custom hook to fetch min and max buy-in values for a table
 * 
 * NOTE: Min and max buy-in values are handled through GameStateContext subscription.
 * Components call subscribeToTable(tableId) which creates a WebSocket connection with both tableAddress 
 * and playerId parameters. This hook reads the real-time buy-in data from that context.
 * 
 * @returns Object containing min/max buy-in values in wei
 */
export const useMinAndMaxBuyIns = (): MinAndMaxBuyInsReturn => {
  // Get game state directly from Context - real-time data via WebSocket
  const { gameState, isLoading, error } = useGameStateContext();

  // Default values in case of error or loading
  const defaultValues: MinAndMaxBuyInsReturn = {
    minBuyInWei: "10000000000000000", // 0.01 ETH
    maxBuyInWei: "1000000000000000000", // 1 ETH
    isLoading,
    error
  };

  // If still loading or error occurred, return default values
  if (isLoading || error || !gameState) {
    return defaultValues;
  }

  try {
    // Extract game options from the game state
    const gameOptions = gameState.gameOptions;

    console.log("🎰 useMinAndMaxBuyIns - Game Options:");
    console.log("  Full gameOptions:", gameOptions);
    console.log("  Game type:", gameOptions?.type);

    if (!gameOptions) {
      console.warn("No game options found in game state");
      return defaultValues;
    }

    // Get min and max buy-in values
    const minBuyInWei = gameOptions.minBuyIn || defaultValues.minBuyInWei;
    const maxBuyInWei = gameOptions.maxBuyIn || defaultValues.maxBuyInWei;

    console.log("🎰 useMinAndMaxBuyIns - Buy-in values:");
    console.log("  minBuyIn from gameOptions:", gameOptions.minBuyIn);
    console.log("  maxBuyIn from gameOptions:", gameOptions.maxBuyIn);
    console.log("  minBuyInWei (final):", minBuyInWei);
    console.log("  maxBuyInWei (final):", maxBuyInWei);

    const result: MinAndMaxBuyInsReturn = {
      minBuyInWei,
      maxBuyInWei,
      isLoading: false,
      error: null
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
