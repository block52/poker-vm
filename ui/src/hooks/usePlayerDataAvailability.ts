import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";

// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => res.data);

/**
 * Custom hook to check if player data is available
 * @param tableId The ID of the table to check
 * @returns Object containing availability flag and loading/error states
 */
export const usePlayerDataAvailability = (tableId?: string) => {
  // Skip the request if no tableId is provided
  const { data, error, isLoading } = useSWR(
    tableId ? `${PROXY_URL}/get_game_state/${tableId}` : null,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true
    }
  );

  // Default values in case of error or loading
  const defaultState = {
    isPlayerDataAvailable: false,
    playersCount: 0,
    isLoading,
    error
  };

  // If still loading or error occurred, return default values
  if (isLoading || error || !data) {
    return defaultState;
  }

  try {
    // Extract table data from the response (handling different API response structures)
    const tableData = data.data || data;
    
    // Check if players array exists and has content
    const isPlayerDataAvailable = !!tableData?.players && Array.isArray(tableData.players);
    const playersCount = isPlayerDataAvailable ? tableData.players.length : 0;
    
    return {
      isPlayerDataAvailable,
      playersCount,
      isLoading: false,
      error: null
    };
  } catch (err) {
    console.error("Error checking player data availability:", err);
    return {
      ...defaultState,
      error: err
    };
  }
}; 