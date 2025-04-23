import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";

// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => res.data);

/**
 * Custom hook to check if a game is in progress
 * @param tableId The ID of the table to check
 * @returns Object containing isGameInProgress flag and loading/error states
 */
export const useGameProgress = (tableId?: string) => {
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
    isGameInProgress: false,
    activePlayers: [],
    playerCount: 0,
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
    
    if (!tableData || !tableData.players) {
      console.warn("No players data found in API response");
      return defaultState;
    }

    // Filter for active players (not folded and not sitting out)
    const activePlayers = tableData.players.filter(
      (player: any) => player.status !== "folded" && player.status !== "sitting-out"
    );

    // Game is in progress if there are at least 2 active players
    const isGameInProgress = activePlayers.length > 1;
    
    return {
      isGameInProgress,
      activePlayers,
      playerCount: activePlayers.length,
      isLoading: false,
      error: null
    };
  } catch (err) {
    console.error("Error checking game progress:", err);
    return {
      ...defaultState,
      error: err
    };
  }
}; 