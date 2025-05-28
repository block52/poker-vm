import { useCallback } from "react";
import { ethers } from "ethers";
import { useGameStateContext } from "../context/GameStateContext";
import { TexasHoldemRound, GameType } from "@bitcoinbrisbane/block52";
import { TableStateReturn } from "../types/index";

/**
 * Custom hook to fetch and provide table state information
 * @param tableId The ID of the table (not used - Context manages subscription)
 * @param autoRefreshIntervalMs Optional refresh interval (not used - WebSocket provides real-time data)
 * @returns Object containing table state properties including round, pot, size, type
 */
export const useTableState = (tableId?: string, autoRefreshIntervalMs?: number): TableStateReturn => {
    // Get game state directly from Context - no additional WebSocket connections
    const { gameState, isLoading, error } = useGameStateContext();

    // Manual refresh function (no-op since WebSocket provides real-time data)
    const refresh = useCallback(async () => {
        console.log("Refresh called - WebSocket provides real-time data, no manual refresh needed");
        return gameState;
    }, [gameState]);

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
        refresh
    };

    // If still loading or error occurred, return default values
    if (isLoading || error || !gameState) {
        return defaultState;
    }

    try {
        // Calculate the total pot from all pots
        let totalPotWei = "0";
        if (gameState.pots && Array.isArray(gameState.pots)) {
            totalPotWei = gameState.pots.reduce((sum: string, pot: string) => {
                const sumBigInt = BigInt(sum);
                const potBigInt = BigInt(pot);
                return (sumBigInt + potBigInt).toString();
            }, "0");
        }

        // Format total pot value to display format
        const formattedTotalPot = ethers.formatUnits(totalPotWei, 18);

        // Extract the current round
        const currentRound = gameState.round || TexasHoldemRound.PREFLOP;

        // Extract table size (maximum players)
        const tableSize = gameState.gameOptions?.maxPlayers || gameState.gameOptions?.minPlayers || 9;

        // Extract table type
        const tableType = gameState.type || GameType.CASH;

        // Round type is the same as current round in this context
        const roundType = currentRound;

        const result: TableStateReturn = {
            currentRound,
            totalPot: totalPotWei,
            formattedTotalPot,
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
