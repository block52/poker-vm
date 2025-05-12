import { useGameState } from "./useGameState";
import { formatWeiToSimpleDollars } from "../utils/numberUtils";

// Interface to represent the structure we expect
interface GameStateFields {
  type?: string;
  address?: string;
  smallBlind?: string;
  bigBlind?: string;
  blinds?: { small?: string; big?: string };
  smallBlindPosition?: number;
  bigBlindPosition?: number;
  positions?: { smallBlind?: number; bigBlind?: number };
  dealer?: number;
  players?: any[];
  communityCards?: string[];
  deck?: string;
  pots?: string[];
  nextToAct?: number;
  round?: string;
  winners?: string[];
  signature?: string;
}

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
    if (!gameState) {
      return emptyState;
    }

    // Cast to our interface to work with properties safely
    const state = gameState as unknown as GameStateFields;
    
    // Map SDK DTO to our expected structure
    const smallBlind = state.smallBlind || state.blinds?.small || "0";
    const bigBlind = state.bigBlind || state.blinds?.big || "0";
    const smallBlindPosition = state.smallBlindPosition || state.positions?.smallBlind || 0;
    const bigBlindPosition = state.bigBlindPosition || state.positions?.bigBlind || 0;

    return {
      isLoading: false,
      error: null,
      tableDataType: state.type || "cash",
      tableDataAddress: state.address || "",
      tableDataSmallBlind: formatWeiToSimpleDollars(smallBlind),
      tableDataBigBlind: formatWeiToSimpleDollars(bigBlind),
      tableDataSmallBlindPosition: smallBlindPosition,
      tableDataBigBlindPosition: bigBlindPosition,
      tableDataDealer: state.dealer || 0,
      tableDataPlayers: state.players || [],
      tableDataCommunityCards: state.communityCards || [],
      tableDataDeck: state.deck || "",
      tableDataPots: state.pots || ["0"],
      tableDataNextToAct: state.nextToAct ?? -1,
      tableDataRound: state.round || "preflop",
      tableDataWinners: state.winners || [],
      tableDataSignature: state.signature || ""
    };
  } catch (err) {
    console.error("Error parsing table data:", err);
    return {
      ...emptyState,
      error: err
    };
  }
}; 