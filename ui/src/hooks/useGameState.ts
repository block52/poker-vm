import useSWR, { mutate as globalMutate } from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { useEffect, useRef } from "react";

// Define a centralized cache key for each table
const getGameStateKey = (tableId: string) => `${PROXY_URL}/get_game_state/${tableId}`;

// Track the last fetch time globally per table - this object persists across all hook instances
// which allows us to implement manual throttling across the entire application
const lastFetchTimes = new Map<string, number>();

// Define the fetcher function that includes the user address as a query parameter
// and implements manual throttling at the fetcher level to catch all requests
const fetcher = async (url: string) => {
  const tableId = url.split("/").pop()?.split("?")[0];
  const now = Date.now();
  const lastFetchTime = tableId ? lastFetchTimes.get(tableId) : 0;
  
  // If we've fetched this table data recently (within last 1 second), skip this fetch
  if (lastFetchTime && now - lastFetchTime < 1000) {
    console.log(`[useGameState] Skipping fetch, last request was ${now - lastFetchTime}ms ago`);
    
    // Instead of trying to access cache directly, we'll just wait
    // Wait until the throttle period is over
    await new Promise(resolve => setTimeout(resolve, 1000 - (now - lastFetchTime)));
  }
  
  // Update the last fetch time for this table
  if (tableId) {
    lastFetchTimes.set(tableId, Date.now());
    console.log(`[useGameState] Fetching at ${new Date().toISOString()} for table ${tableId}`);
  }
  
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
  const requestCountRef = useRef(0);
  const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();
  const key = tableId ? getGameStateKey(tableId) : null;
  
  // Skip the request if no tableId is provided
  const { data, error, isLoading, mutate } = useSWR(
    key,
    fetcher,
    {
      refreshInterval: Math.max(autoRefreshIntervalMs, 1000), // Ensure minimum refresh interval of 1 second
      revalidateOnFocus: true,
      dedupingInterval: 1000, // Always enforce 1 second between requests
      focusThrottleInterval: 1000, // Throttle focus-triggered revalidations
      revalidateIfStale: false, // Disable auto-revalidation on mount if data exists
      revalidateOnReconnect: false, // Don't revalidate on reconnect to avoid spurious requests
    }
  );

  // Log each request to help debug
  useEffect(() => {
    if (key) {
      requestCountRef.current += 1;
      console.log(`[useGameState] Hook instance #${requestCountRef.current} for ${tableId}`);
    }
  }, [key, tableId]);

  // Handle different response structures
  const gameState = data?.data || data;
  
  // Set up an effect to refresh more frequently when the game is in the "end" state
  useEffect(() => {
    if (gameState?.round === "end") {
      // Set a short timeout to do an extra refresh after the game ends
      const timeoutId = setTimeout(() => {
        console.log("Game in 'end' state - doing an extra refresh");
        // Force refresh with skipThrottle: true to bypass our throttling
        if (key) globalMutate(key, undefined, { revalidate: true });
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [gameState?.round, key]);
  
  // Provide a custom refresh function that respects throttling
  const refreshWithThrottle = async () => {
    const tableKey = tableId ? getGameStateKey(tableId) : null;
    if (!tableKey) return;
    
    const now = Date.now();
    const lastFetch = lastFetchTimes.get(tableId || "") || 0;
    
    if (now - lastFetch >= 1000) {
      console.log("[useGameState] Manual refresh triggered");
      return mutate();
    } else {
      console.log(`[useGameState] Throttling manual refresh (${now - lastFetch}ms since last fetch)`);
      // Wait and then refresh
      await new Promise(resolve => setTimeout(resolve, 1000 - (now - lastFetch)));
      return mutate();
    }
  };
  
  return { 
    gameState, 
    error, 
    isLoading, 
    refresh: refreshWithThrottle,
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