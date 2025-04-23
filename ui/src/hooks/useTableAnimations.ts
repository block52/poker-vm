import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";

// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => res.data);

/**
 * Custom hook to provide table animation-related information
 * @param tableId The ID of the table to fetch state for
 * @returns Object containing table animation properties such as tableSize
 */
export const useTableAnimations = (tableId?: string) => {
  // Skip the request if no tableId is provided
  const { data, error, isLoading } = useSWR(
    tableId ? `${PROXY_URL}/get_game_state/${tableId}` : null,
    fetcher,
    {
      // Refresh every 5 seconds and when window is focused
      refreshInterval: 5000,
      revalidateOnFocus: true
    }
  );

  // Default value for tableSize
  const defaultTableSize = 9;

  // If still loading or error occurred, return default values
  if (isLoading || error || !data) {
    return {
      tableSize: defaultTableSize,
      isLoading,
      error
    };
  }

  try {
    // Extract table data from the response
    const tableData = data.data || data;
    
    if (!tableData) {
      console.warn("No table data found in API response");
      return { tableSize: defaultTableSize, isLoading: false, error: null };
    }

    // Extract table size (maximum players) from game options
    const tableSize = tableData.gameOptions?.maxPlayers || 
                      tableData.maxPlayers || 
                      defaultTableSize;

    const result = {
      tableSize,
      isLoading: false,
      error: null
    };

    console.log("[useTableAnimations] Returns:", {
      tableSize: result.tableSize,
      isLoading: result.isLoading,
      hasError: !!result.error
    });

    return result;
  } catch (err) {
    console.error("Error parsing table animations data:", err);
    return {
      tableSize: defaultTableSize,
      isLoading: false,
      error: err
    };
  }
}; 