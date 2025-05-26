import { useGameState } from "./useGameState";
import { TexasHoldemRound, GameType } from "@bitcoinbrisbane/block52";
import { TableStateReturn, GameStateReturn } from "../types/index";

/**
 * Custom hook to fetch and provide table state information
 * @param tableId The ID of the table to fetch state for
 * @param autoRefreshIntervalMs Optional refresh interval in ms, default value to pass to useGameState
 * @returns Object containing table state properties including round, pot, size, type
 */
export const useTableState = (tableId?: string, autoRefreshIntervalMs?: number): TableStateReturn => {
  // Get game state from centralized hook
  const { gameState, isLoading, error, refresh }: GameStateReturn = useGameState(tableId, autoRefreshIntervalMs);

  // Default values in case of error or loading
  const defaultState: TableStateReturn = {
    currentRound: TexasHoldemRound.PREFLOP,
    totalPot: "0",
    tableSize: 9,
    tableType: GameType.CASH,
    roundType: TexasHoldemRound.PREFLOP,
    isLoading,
    error,
    refresh
  };

  // If still loading or error occurred, return default values
  if (isLoading || error || !gameState) {
    return defaultState;
  }

  try {
    // Calculate the total pot from all pots
    let totalPot = "0";
    if (gameState.pots && Array.isArray(gameState.pots)) {
      totalPot = gameState.pots.reduce((sum: string, pot: string) => {
        const sumBigInt = BigInt(sum);
        const potBigInt = BigInt(pot);
        return (sumBigInt + potBigInt).toString();
      }, "0");
    }

    // Extract the current round
    const currentRound = gameState.round || TexasHoldemRound.PREFLOP;

    // Extract table size (maximum players)
    const tableSize = gameState.gameOptions?.maxPlayers || 
                      gameState.gameOptions?.minPlayers || 
                      9;

    // Extract table type
    const tableType = gameState.type || GameType.CASH;

    // Round type is the same as current round in this context
    const roundType = currentRound;

    const result: TableStateReturn = {
      currentRound,
      totalPot: totalPot,
      tableSize,
      tableType: tableType as GameType,
      roundType,
      isLoading: false,
      error: null,
      refresh
    };

    return result;
  } catch (err) {
    console.error("Error parsing table state:", err);
    return {
      ...defaultState,
      error: err as Error
    };
  }
};
