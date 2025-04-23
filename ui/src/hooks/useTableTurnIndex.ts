import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";

// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => {
    console.log("API Response for game state:", res.data);
    return res.data;
  });

/**
 * Extracts game data from API response, handling different response structures
 */
function extractGameData(data: any): any {
  if (!data) return null;
  
  // Check for response.data.data structure
  if (data.data?.previousActions) {
    return data.data;
  }
  
  // Check for response.data structure
  if (data.previousActions) {
    return data;
  }
  
  // Check for response.result.data structure
  if (data.result?.data?.previousActions) {
    return data.result.data;
  }
  
  console.log("⚠️ Unknown API response structure:", data);
  return null;
}

/**
 * Custom hook to get the next turn index for actions at a table
 * @param tableId The table ID
 * @returns The next turn index to use for actions
 */
export function useTableTurnIndex(tableId?: string): number {
  // Fetch game state using SWR
  const { data, error } = useSWR(
    tableId ? `${PROXY_URL}/get_game_state/${tableId}` : null,
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true,
      dedupingInterval: 2000, // Dedupe similar requests within 2 seconds
    }
  );

  // Handle loading and error states
  if (error) {
    console.error("Error loading game state for turn index:", error);
    return 0; // Default to 0 if there's an error
  }
  
  if (!data) {
    console.log("No data received from API for turn index");
    return 0; // Default to 0 if there's no data
  }
  
  // Extract the game data from the response
  const gameData = extractGameData(data);
  if (!gameData) {
    console.log("No game data found in API response for turn index");
    return 0; // Default to 0 if no game data is found
  }

  try {
    // Get the previousActions array
    const previousActions = gameData.previousActions || [];
    
    if (previousActions.length === 0) {
      console.log("No previous actions found, returning index 0");
      return 0; // If no previous actions, start with index 0
    }
    
    // Sort actions by index to ensure we get the highest one
    // This is in case they're not already sorted
    const sortedActions = [...previousActions].sort((a, b) => a.index - b.index);
    
    // Get the latest action (highest index)
    const latestAction = sortedActions[sortedActions.length - 1];
    
    // The next index is the latest index + 1
    const nextIndex = latestAction.index + 1;
    console.log(`Latest action index: ${latestAction.index}, next index: ${nextIndex}`);
    
    console.log("[useTableTurnIndex] Returns:", nextIndex);
    
    return nextIndex;
  } catch (err) {
    console.error("Error calculating next turn index:", err);
    return 0; // Default to 0 if there's an error
  }
} 