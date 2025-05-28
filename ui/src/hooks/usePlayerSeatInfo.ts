import { useMemo, useCallback } from "react";
import { PlayerDTO } from "@bitcoinbrisbane/block52";
import { useGameStateContext } from "../context/GameStateContext";
import { PlayerSeatInfoReturn } from "../types/index";

/**
 * Custom hook to manage player seat information
 * @param tableId The ID of the table (not used - Context manages subscription)
 * @returns Object containing player seat information and related functions
 */
export const usePlayerSeatInfo = (tableId?: string): PlayerSeatInfoReturn => {
    // Get game state directly from Context - no additional WebSocket connections
    const { gameState, isLoading, error } = useGameStateContext();

    // Manual refresh function (no-op since WebSocket provides real-time data)
    const refresh = useCallback(async () => {
        console.log("Refresh called - WebSocket provides real-time data, no manual refresh needed");
        return gameState;
    }, [gameState]);

    // Get user address from local storage
    const userWalletAddress = useMemo(() => {
        const address = localStorage.getItem("user_eth_public_key");
        return address ? address.toLowerCase() : null;
    }, []);

    // Find current user's seat
    const currentUserSeat = useMemo((): number => {
        if (!gameState?.players || !userWalletAddress) {
            return -1;
        }

        const player = gameState.players.find((p: PlayerDTO) => p.address?.toLowerCase() === userWalletAddress);

        return player ? player.seat : -1;
    }, [gameState, userWalletAddress]);

    // Create user data by seat mapping
    const userDataBySeat = useMemo((): Record<number, PlayerDTO> => {
        if (!gameState?.players) {
            return {};
        }

        const result: Record<number, PlayerDTO> = {};
        gameState.players.forEach((player: PlayerDTO) => {
            if (player && typeof player.seat === "number" && player.seat >= 0) {
                result[player.seat] = player;
            }
        });

        return result;
    }, [gameState]);

    // Helper function to get user data by seat
    const getUserBySeat = useCallback(
        (seat: number): PlayerDTO | null => {
            return userDataBySeat[seat] || null;
        },
        [userDataBySeat]
    );

    return {
        currentUserSeat,
        userDataBySeat,
        getUserBySeat,
        isLoading,
        error,
        refresh
    };
};
