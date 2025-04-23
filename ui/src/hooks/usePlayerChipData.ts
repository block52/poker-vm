import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { formatWeiToDollars } from "../utils/numberUtils";

// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => res.data);

/**
 * Custom hook to fetch and provide player chip data for each seat
 * @param tableId The ID of the table to fetch data for
 * @returns Object containing player chip data mapped by seat
 */
export const usePlayerChipData = (tableId?: string) => {
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
    chipDataBySeat: {},
    getChipAmount: (seatIndex: number): number => 0,
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

    // Create a map of player chip data by seat
    const chipDataBySeat = tableData.players.reduce((acc: any, player: any) => {
      if (player && player.seat !== undefined) {
        acc[player.seat] = {
          stack: player.stack || "0",
          sumOfBets: player.sumOfBets || "0",
          formattedSumOfBets: formatWeiToDollars(player.sumOfBets || "0")
        };
      }
      return acc;
    }, {});

    // Function to get chip amount for a given seat
    const getChipAmount = (seatIndex: number): number => {
      const playerData = chipDataBySeat[seatIndex];
      if (!playerData) return 0;
      return parseFloat(formatWeiToDollars(playerData.sumOfBets));
    };
    
    return {
      chipDataBySeat,
      getChipAmount,
      isLoading: false,
      error: null
    };
  } catch (err) {
    console.error("Error parsing player chip data:", err);
    return {
      ...defaultState,
      error: err
    };
  }
}; 