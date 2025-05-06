import { useGameState } from "./useGameState";
import { formatWeiToSimpleDollars } from "../utils/numberUtils";

/**
 * Custom hook to provide formatted table data
 * @param tableId The ID of the table to fetch data for
 * @returns Object containing formatted table data and loading/error states
 */
export const useTableData = (tableId?: string) => {
  // Get game state from centralized hook
  const { gameState, isLoading, error } = useGameState(tableId);

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
    if (!gameState || gameState.type !== "cash") {
      return emptyState;
    }

    return {
      isLoading: false,
      error: null,
      tableDataType: gameState.type,
      tableDataAddress: gameState.address,
      tableDataSmallBlind: formatWeiToSimpleDollars(gameState.smallBlind),
      tableDataBigBlind: formatWeiToSimpleDollars(gameState.bigBlind),
      tableDataSmallBlindPosition: gameState.smallBlindPosition,
      tableDataBigBlindPosition: gameState.bigBlindPosition,
      tableDataDealer: gameState.dealer,
      tableDataPlayers: gameState.players || [],
      tableDataCommunityCards: gameState.communityCards || [],
      tableDataDeck: gameState.deck || "",
      tableDataPots: gameState.pots || ["0"],
      tableDataNextToAct: gameState.nextToAct ?? -1,
      tableDataRound: gameState.round || "preflop",
      tableDataWinners: gameState.winners || [],
      tableDataSignature: gameState.signature || ""
    };
  } catch (err) {
    console.error("Error parsing table data:", err);
    return {
      ...emptyState,
      error: err
    };
  }
}; 