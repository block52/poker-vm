import { useState, useEffect, useMemo } from "react";
import { useGameState } from "./useGameState";
import { PlayerStatus, PlayerDTO } from "@bitcoinbrisbane/block52";
import { PlayerTimerReturn, GameStateReturn } from "../types/index";

/**
 * Custom hook to manage player timer information
 * @param tableId The ID of the table
 * @param playerSeat The seat number of the player to check (1-based)
 * @returns Object containing player status and timer information
 */
export const usePlayerTimer = (tableId?: string, playerSeat?: number): PlayerTimerReturn => {
    const [progress, setProgress] = useState(0);

    // Get game state from centralized hook
    const { gameState, isLoading, error }: GameStateReturn = useGameState(tableId);

    // Find the player by seat number
    const player = useMemo((): PlayerDTO | null => {
        if (!gameState?.players || playerSeat === undefined) {
            return null;
        }

        return gameState.players.find((p: PlayerDTO) => p.seat === playerSeat) || null;
    }, [gameState, playerSeat]);

    // Get player status
    const playerStatus = useMemo((): PlayerStatus => {
        if (!player?.status) {
            return PlayerStatus.NOT_ACTED;
        }
        return player.status;
    }, [player]);

    // Get timeout value
    const timeoutValue = useMemo((): number => {
        return player?.timeout || 30; // Default to 30 seconds
    }, [player]);

    // Reset progress when player or status changes
    useEffect(() => {
        setProgress(0);
    }, [player, playerStatus]);

    // Handle timer progression
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (playerStatus === PlayerStatus.TURN) {
            setProgress(0); // Reset progress when turn starts

            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= timeoutValue) {
                        clearInterval(interval!);
                        return prev;
                    }
                    return prev + 1; // Increment progress
                });
            }, 1000); // Update every second
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [playerStatus, timeoutValue]);

    // Calculate derived values
    const timeRemaining = useMemo(() => Math.max(0, timeoutValue - progress), [timeoutValue, progress]);
    const isActive = useMemo(() => playerStatus === PlayerStatus.TURN, [playerStatus]);

    return {
        playerStatus,
        timeoutValue,
        progress,
        timeRemaining,
        isActive,
        isLoading,
        error
    };
};
