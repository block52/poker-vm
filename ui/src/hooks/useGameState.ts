import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";

// Define the fetcher function that includes the user address as a query parameter
const fetcher = (url: string) => {
  const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();
  return axios.get(`${url}?userAddress=${userAddress}`).then(res => res.data);
};

/**
 * Central hook for fetching game state data
 * This hook is used by other hooks to avoid multiple fetch requests for the same data
 * @param tableId The ID of the table to fetch state for
 * @returns Object containing game state data and SWR utilities
 */
export const useGameState = (tableId?: string) => {
  const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();
  
  // Skip the request if no tableId is provided
  const { data, error, isLoading, mutate } = useSWR(
    tableId ? `${PROXY_URL}/get_game_state/${tableId}` : null,
    fetcher,
    {
      refreshInterval: 10000,
      revalidateOnFocus: true,
      dedupingInterval: 10000, // Prevent duplicate requests within 3 seconds
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