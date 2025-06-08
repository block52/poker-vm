import { useMemo } from "react";
import { PlayerDTO } from "@bitcoinbrisbane/block52";
import { useGameStateContext } from "../context/GameStateContext";
import { PlayerSeatInfoReturn } from "../types/index";

/**
 * Custom hook to manage player seat information
 * 
 * NOTE: Player seat information is handled through GameStateContext subscription.
 * Components call subscribeToTable(tableId) which creates a WebSocket connection with both tableAddress 
 * and playerId parameters. This hook reads the real-time player seat data from that context.
 * 
 * @returns Object containing player seat information and related functions
 */
export const usePlayerSeatInfo = (): PlayerSeatInfoReturn => {
    // Get game state directly from Context - real-time data via WebSocket
    const { gameState, isLoading, error } = useGameStateContext();

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

    return {
        currentUserSeat,
        userDataBySeat,
        isLoading,
        error
    };
};
