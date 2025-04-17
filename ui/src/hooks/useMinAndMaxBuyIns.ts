import useSWR from "swr";
import axios from "axios";
import { ethers } from "ethers";
import { PROXY_URL } from "../config/constants";

// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => res.data);

/**
 * Custom hook to fetch min and max buy-in values for a table
 * @param tableId The table ID to fetch limits for
 * @returns Object containing min/max buy-in values in both wei and formatted values
 */
export const useMinAndMaxBuyIns = (tableId?: string) => {
  // Skip the request if no tableId is provided
  const { data, error, isLoading, mutate } = useSWR(
    tableId ? `${PROXY_URL}/get_game_state/${tableId}` : null,
    fetcher,
    {
      // Refresh every 30 seconds and when window is focused
      refreshInterval: 30000,
      revalidateOnFocus: true
    }
  );

  // Default values in case of error or loading
  const defaultValues = {
    minBuyInWei: "10000000000000000", // 0.01 ETH
    maxBuyInWei: "1000000000000000000", // 1 ETH
    minBuyInFormatted: "0.01",
    maxBuyInFormatted: "1.0",
    isLoading,
    error,
    refresh: mutate
  };

  // If still loading or error occurred, return default values
  if (isLoading || error || !data || !data.data) {
    return defaultValues;
  }

  try {
    // Extract game options from the data
    const gameOptions = data.data.gameOptions;
    
    if (!gameOptions) {
      console.warn("No game options found in table data");
      return defaultValues;
    }

    // Get min and max buy-in values
    const minBuyInWei = gameOptions.minBuyIn || defaultValues.minBuyInWei;
    const maxBuyInWei = gameOptions.maxBuyIn || defaultValues.maxBuyInWei;

    // Format values to human-readable form
    const minBuyInFormatted = ethers.formatUnits(minBuyInWei, 18);
    const maxBuyInFormatted = ethers.formatUnits(maxBuyInWei, 18);

    return {
      minBuyInWei,
      maxBuyInWei,
      minBuyInFormatted,
      maxBuyInFormatted,
      isLoading,
      error,
      refresh: mutate
    };
  } catch (err) {
    console.error("Error parsing buy-in values:", err);
    return defaultValues;
  }
};
