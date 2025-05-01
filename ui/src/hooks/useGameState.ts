import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { useEffect } from "react";

// Define the fetcher function that includes the user address as a query parameter
const fetcher = (url: string) => {
  const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();
  return axios.get(`${url}?userAddress=${userAddress}`).then(res => res.data);
};

/**
 * Central hook for fetching game state data
 * This hook is used by other hooks to avoid multiple fetch requests for the same data
 * @param tableId The ID of the table to fetch state for
 * @param autoRefreshIntervalMs Optional refresh interval in ms, set to 0 to disable auto-refresh
 * @returns Object containing game state data and SWR utilities
 */
export const useGameState = (tableId?: string, autoRefreshIntervalMs: number = 10000) => {
  const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();
  
  // Skip the request if no tableId is provided
  const { data, error, isLoading, mutate } = useSWR(
    tableId ? `${PROXY_URL}/get_game_state/${tableId}` : null,
    fetcher,
    {
      refreshInterval: autoRefreshIntervalMs,
      revalidateOnFocus: true,
      dedupingInterval: Math.min(3000, autoRefreshIntervalMs), // Prevent duplicate requests within 3 seconds or less
    }
  );

  // Handle different response structures
  const gameState = data?.data || data;
  
  // Set up an effect to refresh more frequently when the game is in the "end" state
  useEffect(() => {
    if (gameState?.round === "end") {
      // Set a short timeout to do an extra refresh after the game ends
      const timeoutId = setTimeout(() => {
        console.log("Game in 'end' state - doing an extra refresh");
        mutate();
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [gameState?.round, mutate]);
  
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