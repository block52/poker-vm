import { useMemo } from "react";
import { useGameStateContext } from "../context/GameStateContext";
import { PlayerDTO, TexasHoldemRound } from "@block52/poker-vm-sdk";
import { TableDataReturn } from "../types/index";

/**
 * Custom hook to provide formatted table data
 * 
 * NOTE: Table data is handled through GameStateContext subscription.
 * Components call subscribeToTable(tableId) which creates a WebSocket connection with both tableAddress 
 * and playerId parameters. This hook reads the real-time table data from that context.
 * 
 * @returns Object containing formatted table data and loading/error states
 */
export const useTableData = (): TableDataReturn => {
  // Get game state directly from Context - real-time data via WebSocket
  const { gameState, isLoading, error } = useGameStateContext();

  // Memoize the processed table data
  const tableData = useMemo((): Omit<TableDataReturn, "isLoading" | "error"> => {
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
      tableDataRound: TexasHoldemRound.PREFLOP,
      tableDataWinners: [] as string[],
      tableDataSignature: ""
    };

    if (!gameState) {
      return defaultData;
    }

    try {
      // Extract data directly from the SDK DTO structure
      // Return raw BigInt strings - components will format for display
      const smallBlind = gameState.gameOptions?.smallBlind || "0";
      const bigBlind = gameState.gameOptions?.bigBlind || "0";

      return {
        tableDataType: defaultData.tableDataType,
        tableDataAddress: gameState.address || defaultData.tableDataAddress,
        tableDataSmallBlind: smallBlind,
        tableDataBigBlind: bigBlind,
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
    error
  };
}; 