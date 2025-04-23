import useSWR from "swr";
import axios from "axios";
import { ethers } from "ethers";
import { PROXY_URL } from "../config/constants";
import { TexasHoldemRound, GameType } from "@bitcoinbrisbane/block52";

// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => res.data);

/**
 * Custom hook to fetch and provide table state information
 * @param tableId The ID of the table to fetch state for
 * @returns Object containing table state properties including round, pot, size, type
 */
export const useTableState = (tableId?: string) => {
  // Skip the request if no tableId is provided
  const { data, error, isLoading, mutate } = useSWR(
    tableId ? `${PROXY_URL}/get_game_state/${tableId}` : null,
    fetcher,
    {
      // Refresh every 5 seconds and when window is focused
      refreshInterval: 5000,
      revalidateOnFocus: true
    }
  );

  // Default values in case of error or loading
  const defaultState = {
    currentRound: TexasHoldemRound.PREFLOP,
    totalPot: "0",
    formattedTotalPot: "0.00",
    tableSize: 9,
    tableType: GameType.CASH,
    roundType: TexasHoldemRound.PREFLOP,
    isLoading,
    error,
    refresh: mutate
  };

  // If still loading or error occurred, return default values
  if (isLoading || error || !data) {
    return defaultState;
  }

  try {
    // Extract table data from the response (handling different API response structures)
    const tableData = data.data || data;
    
    if (!tableData) {
      console.warn("No table data found in API response");
      return defaultState;
    }

    // Calculate the total pot from all pots
    let totalPotWei = "0";
    if (tableData.pots && Array.isArray(tableData.pots)) {
      totalPotWei = tableData.pots.reduce((sum: string, pot: string) => {
        const sumBigInt = BigInt(sum);
        const potBigInt = BigInt(pot);
        return (sumBigInt + potBigInt).toString();
      }, "0");
    }

    // Format total pot value to display format
    const formattedTotalPot = ethers.formatUnits(totalPotWei, 18);

    // Extract the current round
    const currentRound = tableData.round || TexasHoldemRound.PREFLOP;

    // Extract table size (maximum players)
    const tableSize = tableData.gameOptions?.maxPlayers || 
                      tableData.maxPlayers || 
                      9;

    // Extract table type
    const tableType = tableData.type || GameType.CASH;

    // Round type is the same as current round in this context
    const roundType = currentRound;

    const result = {
      currentRound,
      totalPot: totalPotWei,
      formattedTotalPot,
      tableSize,
      tableType,
      roundType,
      isLoading: false,
      error: null,
      refresh: mutate
    };

    console.log("[useTableState] Returns:", {
      currentRound,
      formattedTotalPot,
      tableSize,
      tableType,
      roundType,
      isLoading: false,
      hasError: false
    });

    return result;
  } catch (err) {
    console.error("Error parsing table state:", err);
    return {
      ...defaultState,
      error: err
    };
  }
};
