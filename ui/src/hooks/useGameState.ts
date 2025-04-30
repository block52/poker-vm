import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";

// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => res.data);

/**
 * Central hook for fetching game state data
 * This hook is used by other hooks to avoid multiple fetch requests for the same data
 * @param tableId The ID of the table to fetch state for
 * @returns Object containing game state data and SWR utilities
 */
export const useGameState = (tableId?: string) => {
  // Skip the request if no tableId is provided
  const { data, error, isLoading, mutate } = useSWR(
    tableId ? `${PROXY_URL}/get_game_state/${tableId}` : null,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      dedupingInterval: 3000, // Prevent duplicate requests within 3 seconds
    }
  );

  // Handle different response structures
  const gameState = data?.data || data;
  
  return { 
    gameState, 
    error, 
    isLoading, 
    refresh: mutate,
    // Helper function to safely extract nested properties
    getNestedValue: (path: string) => {
      if (!gameState) return undefined;
      
      return path.split(".").reduce((obj, key) => 
        (obj && obj[key] !== undefined) ? obj[key] : undefined, 
        gameState
      );
    }
  };
}; 