import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useNodeRpc } from "../context/NodeRpcContext";

/**
 * Custom hook to fetch min and max buy-in values for a table
 * @param tableId The table ID to fetch limits for
 * @returns Object containing min/max buy-in values in both wei and formatted values
 */
export const useMinAndMaxBuyIns = (tableId?: string) => {
  const { client, isLoading: clientLoading } = useNodeRpc();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to refresh the data
  const refresh = async () => {
    if (!tableId || !client) return;
    
    setIsLoading(true);
    try {
      const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();
      if (!userAddress) {
        throw new Error("No user address found");
      }
      
      const gameState = await client.getGameState(tableId, userAddress);
      setData(gameState);
      setError(null);
    } catch (err) {
      console.error("Error fetching game state:", err);
      setError(err instanceof Error ? err : new Error("Unknown error fetching game state"));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when dependencies change
  useEffect(() => {
    if (tableId && client && !clientLoading) {
      refresh();
    } else if (!clientLoading && !tableId) {
      setIsLoading(false);
    }
  }, [tableId, client, clientLoading]);

  // Set up periodic refresh (every 30 seconds)
  useEffect(() => {
    if (!tableId || !client) return;
    
    const intervalId = setInterval(refresh, 30000);
    
    return () => clearInterval(intervalId);
  }, [tableId, client]);

  // Default values in case of error or loading
  const defaultValues = {
    minBuyInWei: "10000000000000000", // 0.01 ETH
    maxBuyInWei: "1000000000000000000", // 1 ETH
    minBuyInFormatted: "0.01",
    maxBuyInFormatted: "1.0",
    isLoading: isLoading || clientLoading,
    error,
    refresh
  };

  // If still loading or error occurred, return default values
  if (isLoading || clientLoading || error || !data) {
    return defaultValues;
  }

  try {
    // Extract game options from the data
    const gameOptions = data.gameOptions;
    
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
      isLoading: isLoading || clientLoading,
      error,
      refresh
    };

    return result;
  } catch (err) {
    console.error("Error parsing buy-in values:", err);
    return defaultValues;
  }
};
