import { useMemo } from "react";
import { useGameState } from "./useGameState";
import { formatWeiToSimpleDollars } from "../utils/numberUtils";
import { PlayerDTO, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { TableDataReturn, GameStateReturn } from "../types/index";

/**
 * Custom hook to provide formatted table data
 * @param tableId The ID of the table to fetch data for
 * @returns Object containing formatted table data and loading/error states
 */
export const useTableData = (tableId?: string): TableDataReturn => {
  // Get game state from centralized hook
  const { gameState, isLoading, error, refresh }: GameStateReturn = useGameState(tableId);

  // Memoize the processed table data
  const tableData = useMemo((): Omit<TableDataReturn, "isLoading" | "error" | "refresh"> => {
    // Default empty state
    const defaultData = {
      tableDataType: "cash",
      tableDataAddress: "",
      tableDataSmallBlind: "0.00",
      tableDataBigBlind: "0.00",
      tableDataSmallBlindPosition: 0,
      tableDataBigBlindPosition: 0,
      tableDataDealer: 0,
      tableDataPlayers: [] as PlayerDTO[],
      tableDataCommunityCards: [] as string[],
      tableDataDeck: "",
      tableDataPots: ["0"],
      tableDataNextToAct: -1,
      tableDataRound: "preflop" as TexasHoldemRound,
      tableDataWinners: [] as string[],
      tableDataSignature: ""
    };

    if (!gameState) {
      return defaultData;
    }

    try {
      // Extract data directly from the SDK DTO structure
      const smallBlind = gameState.gameOptions?.smallBlind || "0";
      const bigBlind = gameState.gameOptions?.bigBlind || "0";

      return {
        tableDataType: defaultData.tableDataType,
        tableDataAddress: gameState.address || defaultData.tableDataAddress,
        tableDataSmallBlind: formatWeiToSimpleDollars(smallBlind),
        tableDataBigBlind: formatWeiToSimpleDollars(bigBlind),
        tableDataSmallBlindPosition: gameState.smallBlindPosition ?? defaultData.tableDataSmallBlindPosition,
        tableDataBigBlindPosition: gameState.bigBlindPosition ?? defaultData.tableDataBigBlindPosition,
        tableDataDealer: gameState.dealer ?? defaultData.tableDataDealer,
        tableDataPlayers: gameState.players || defaultData.tableDataPlayers,
        tableDataCommunityCards: gameState.communityCards || defaultData.tableDataCommunityCards,
        tableDataDeck: gameState.deck || defaultData.tableDataDeck,
        tableDataPots: gameState.pots || defaultData.tableDataPots,
        tableDataNextToAct: gameState.nextToAct ?? defaultData.tableDataNextToAct,
        tableDataRound: gameState.round || defaultData.tableDataRound,
        tableDataWinners: gameState.winners?.map(winner => typeof winner === "string" ? winner : winner.address || "") || defaultData.tableDataWinners,
        tableDataSignature: gameState.signature || defaultData.tableDataSignature
      };
    } catch (err) {
      console.error("Error parsing table data:", err);
      return defaultData;
    }
  }, [gameState]);

  return {
    ...tableData,
    isLoading,
    error,
    refresh
  };
}; 