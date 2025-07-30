import React from "react";
import { ethers } from "ethers";
import { PlayerStatus, PlayerDTO } from "@bitcoinbrisbane/block52";
import { PlayerDataReturn } from "../types/index";
import { useGameStateContext } from "../context/GameStateContext";

/**
 * Custom hook to fetch player data for a specific seat
 *
 * NOTE: Player data is handled through GameStateContext subscription.
 * Components call subscribeToTable(tableId) which creates a WebSocket connection with both tableAddress
 * and playerId parameters. This hook reads the real-time player data from that context.
 *
 * @param seatIndex The seat index to get player data for
 * @returns Object with player data and utility functions
 */
export const usePlayerData = (seatIndex?: number): PlayerDataReturn => {
    // Get game state directly from Context - real-time data via WebSocket
    const { gameState, error, isLoading } = useGameStateContext();

    // Get player data from the table state
    const playerData = React.useMemo((): PlayerDTO | null => {
        if (!gameState || !seatIndex) {
            return null;
        }

        if (!gameState.players) {
            return null;
        }

        const player = gameState.players.find((p: PlayerDTO) => p.seat === seatIndex);

        return player || null;
    }, [gameState, seatIndex]);

    // Format stack value with ethers.js (more accurate for large numbers)
    const stackValue = React.useMemo((): number => {
        if (!playerData?.stack) return 0;
        return Number(ethers.formatUnits(playerData.stack, 18));
    }, [playerData]);

    // Calculate derived properties
    const isFolded = React.useMemo((): boolean => {
        return playerData?.status === PlayerStatus.FOLDED;
    }, [playerData]);

    const isAllIn = React.useMemo((): boolean => {
        return playerData?.status === PlayerStatus.ALL_IN;
    }, [playerData]);

    const holeCards = React.useMemo((): string[] => {
        return playerData?.holeCards || [];
    }, [playerData]);

    const round = React.useMemo(() => {
        return gameState?.round || null;
    }, [gameState]);

    return {
        playerData,
        stackValue,
        isFolded,
        isAllIn,
        holeCards,
        round,
        isLoading,
        error
    };
};
