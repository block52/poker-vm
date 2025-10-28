import { useGameStateContext } from "../context/GameStateContext";
import { TexasHoldemRound, GameType } from "@bitcoinbrisbane/block52";
import { TableStateReturn } from "../types/index";

const DEFAULT_TABLE_SIZE = 9;

/**
 * Custom hook to fetch and provide table state information
 * 
 * NOTE: Table state information is handled through GameStateContext subscription.
 * Components call subscribeToTable(tableId) which creates a WebSocket connection with both tableAddress 
 * and playerId parameters. This hook reads the real-time table state data from that context.
 * 
 * @returns Object containing table state properties including round, pot, size, type
 */
export const useTableState = (): TableStateReturn => {
    // Get game state directly from Context - real-time data via WebSocket
    const { gameState, isLoading, error } = useGameStateContext();

    // Default values in case of error or loading
    const defaultState: TableStateReturn = {
        currentRound: TexasHoldemRound.PREFLOP,
        pot: "0",
        tableSize: DEFAULT_TABLE_SIZE,
        tableType: GameType.CASH,
        roundType: TexasHoldemRound.PREFLOP,
        isLoading,
        error
    };

    // If still loading or error occurred, return default values
    if (isLoading || error || !gameState) {
        return defaultState;
    }

    try {
        // Calculate the total pot from all pots
        let totalPotWei: bigint = 0n;
        if (gameState.pots && Array.isArray(gameState.pots)) {
            totalPotWei = gameState.pots.reduce((sum: bigint, pot: string) => {
                const sumBigInt: bigint = sum;
                const potBigInt: bigint = BigInt(pot);
                return (sumBigInt + potBigInt);
            }, 0n);
        }

        // Extract the current round
        const currentRound = gameState.round || TexasHoldemRound.PREFLOP;

        // Extract table size (maximum players)
        const tableSize = gameState.gameOptions?.maxPlayers || gameState.gameOptions?.minPlayers || DEFAULT_TABLE_SIZE;

        // Extract table type
        const tableType = gameState.type || GameType.CASH;

        const result: TableStateReturn = {
            currentRound,
            pot: totalPotWei.toString(),
            tableSize,
            tableType: tableType as GameType,
            roundType: currentRound,
            isLoading: false,
            error: null
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
