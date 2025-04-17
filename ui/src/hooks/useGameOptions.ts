import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { GameOptions } from "@bitcoinbrisbane/block52"

// Define default values
export const DEFAULT_SMALL_BLIND = "100000000000000000"; // 0.1 ETH
export const DEFAULT_BIG_BLIND = "200000000000000000"; // 0.2 ETH
export const DEFAULT_MIN_BUY_IN = "10000000000000000"; // 0.01 ETH
export const DEFAULT_MAX_BUY_IN = "1000000000000000000"; // 1 ETH



// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => res.data);

/**
 * Custom hook to fetch game options for a table
 * @param tableId The table ID to fetch options for
 * @returns Object containing game options and loading state
 */
export const useGameOptions = (tableId?: string) => {
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
  const defaultOptions: GameOptions = {
    minBuyIn: BigInt(DEFAULT_MIN_BUY_IN),
    maxBuyIn: BigInt(DEFAULT_MAX_BUY_IN),
    maxPlayers: 9,
    minPlayers: 2,
    smallBlind: BigInt(DEFAULT_SMALL_BLIND),
    bigBlind: BigInt(DEFAULT_BIG_BLIND),
    timeout: 300
  };

  // If still loading or error occurred, return default values
  if (isLoading || error || !data || !data.data) {
    return {
      gameOptions: defaultOptions,
      isLoading,
      error,
      refresh: mutate
    };
  }

  try {
    // Extract game options from the data
    const gameOptions = data.data.gameOptions;
    
    if (!gameOptions) {
      console.warn("No game options found in table data");
      return {
        gameOptions: defaultOptions,
        isLoading,
        error,
        refresh: mutate
      };
    }

    // Use the game options from the API with fallbacks to defaults
    const options: GameOptions = {
      minBuyIn: gameOptions.minBuyIn || defaultOptions.minBuyIn,
      maxBuyIn: gameOptions.maxBuyIn || defaultOptions.maxBuyIn,
      maxPlayers: gameOptions.maxPlayers || defaultOptions.maxPlayers,
      minPlayers: gameOptions.minPlayers || defaultOptions.minPlayers,
      smallBlind: gameOptions.smallBlind || defaultOptions.smallBlind,
      bigBlind: gameOptions.bigBlind || defaultOptions.bigBlind,
      timeout: gameOptions.timeout || defaultOptions.timeout
    };

    return {
      gameOptions: options,
      isLoading,
      error,
      refresh: mutate
    };
  } catch (err) {
    console.error("Error parsing game options:", err);
    return {
      gameOptions: defaultOptions,
      isLoading,
      error,
      refresh: mutate
    };
  }
}; 