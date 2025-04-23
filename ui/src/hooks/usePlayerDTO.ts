import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { PlayerDTO, PlayerStatus, ActionDTO, LegalActionDTO } from "@bitcoinbrisbane/block52";

// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => res.data);

/**
 * Extracts the player data from the API response
 * @param data The raw API response data
 * @returns Array of PlayerDTO objects or null if data is invalid
 */
function extractPlayerData(data: any): PlayerDTO[] | null {
  if (!data) return null;

  // Check if data has the expected structure
  if (data.result?.data?.players) {
    return data.result.data.players;
  } else if (data.data?.players) {
    return data.data.players;
  } else if (data.players) {
    return data.players;
  }

  console.warn("Unable to find player data in API response:", data);
  return null;
}

/**
 * Custom hook to fetch and provide player data from the table
 * @param tableId The ID of the table to fetch player data for
 * @returns Object containing players array and loading state
 */
export function usePlayerDTO(tableId?: string) {
  // Skip the request if no tableId is provided
  const { data, error, isLoading, mutate } = useSWR(
    tableId ? `${PROXY_URL}/get_game_state/${tableId}` : null,
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true
    }
  );

  // Extract player data from the response
  const players = data ? extractPlayerData(data) : null;

  const result = {
    players,
    isLoading,
    error,
    refresh: mutate
  };

  console.log("[usePlayerDTO] Returns:", {
    hasPlayers: !!players,
    numPlayers: players?.length || 0,
    playerSeats: players?.map((p: PlayerDTO) => p.seat) || [],
    isLoading,
    hasError: !!error
  });

  return result;
} 