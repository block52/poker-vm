import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { formatWeiToSimpleDollars } from "../utils/numberUtils";

// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => res.data);

/**
 * Custom hook to provide formatted table data
 * @param tableId The ID of the table to fetch data for
 * @returns Object containing formatted table data and loading/error states
 */
export const useTableData = (tableId?: string) => {
  // Skip the request if no tableId is provided
  const { data, error, isLoading } = useSWR(
    tableId ? `${PROXY_URL}/get_game_state/${tableId}` : null,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true
    }
  );

  // Default empty state
  const emptyState = {
    isLoading: false,
    error: null,
    tableDataType: "cash",
    tableDataAddress: "",
    tableDataSmallBlind: "0.00",
    tableDataBigBlind: "0.00",
    tableDataSmallBlindPosition: 0,
    tableDataBigBlindPosition: 0,
    tableDataDealer: 0,
    tableDataPlayers: [],
    tableDataCommunityCards: [],
    tableDataDeck: "",
    tableDataPots: ["0"],
    tableDataNextToAct: -1,
    tableDataRound: "preflop",
    tableDataWinners: [],
    tableDataSignature: ""
  };

  // If still loading, return loading state
  if (isLoading) {
    return { ...emptyState, isLoading: true };
  }

  // If error occurred, return error state
  if (error) {
    return { ...emptyState, error };
  }

  try {
    // Extract table data from the response (handling different API response structures)
    const tableData = data?.data || data;
    
    if (!tableData || tableData.type !== "cash") {
      return emptyState;
    }

    return {
      isLoading: false,
      error: null,
      tableDataType: tableData.type,
      tableDataAddress: tableData.address,
      tableDataSmallBlind: formatWeiToSimpleDollars(tableData.smallBlind),
      tableDataBigBlind: formatWeiToSimpleDollars(tableData.bigBlind),
      tableDataSmallBlindPosition: tableData.smallBlindPosition,
      tableDataBigBlindPosition: tableData.bigBlindPosition,
      tableDataDealer: tableData.dealer,
      tableDataPlayers: tableData.players || [],
      tableDataCommunityCards: tableData.communityCards || [],
      tableDataDeck: tableData.deck || "",
      tableDataPots: tableData.pots || ["0"],
      tableDataNextToAct: tableData.nextToAct ?? -1,
      tableDataRound: tableData.round || "preflop",
      tableDataWinners: tableData.winners || [],
      tableDataSignature: tableData.signature || ""
    };
  } catch (err) {
    console.error("Error parsing table data:", err);
    return {
      ...emptyState,
      error: err
    };
  }
}; 