import { useGameState } from "./useGameState";
import { useMemo } from "react";
import { PlayerDTO, LegalActionDTO, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { NextToActInfoReturn, GameStateReturn } from "../types/index";

/**
 * Custom hook to fetch and provide information about who is next to act
 * @param tableId The ID of the table to fetch state for
 * @returns Object containing next-to-act information
 */
export const useNextToActInfo = (tableId?: string): NextToActInfoReturn => {
    // Get game state from centralized hook
    const { gameState, isLoading, error }: GameStateReturn = useGameState(tableId);

    // Calculate next-to-act information
    const result = useMemo(() => {
        // Create default values inside useMemo to avoid dependency issues
        const defaultValues: NextToActInfoReturn = {
            seat: null,
            player: null,
            isCurrentUserTurn: false,
            availableActions: [],
            timeRemaining: 30,
            isLoading,
            error
        };

        try {
            if (!gameState || !gameState.players || !Array.isArray(gameState.players) || gameState.players.length === 0) {
                return defaultValues;
            }

            const nextToActSeat = gameState.nextToAct;
            if (nextToActSeat === undefined || nextToActSeat === null) {
                return defaultValues;
            }

            // Find the player who is next to act
            const player = gameState.players.find((p: any) => p && p.seat === nextToActSeat);
            if (!player) {
                return defaultValues;
            }

            // Check if it's the current user's turn
            const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();
            const isCurrentUserTurn = player.address?.toLowerCase() === userAddress;

            // Get available actions - ensure it's an array
            const availableActions: LegalActionDTO[] = Array.isArray(player.legalActions) ? player.legalActions : [];

            // Calculate time remaining
            const timeRemaining = player.timeout || 30;

            return {
                seat: nextToActSeat,
                player,
                isCurrentUserTurn,
                availableActions,
                timeRemaining,
                isLoading: false,
                error: null
            };
        } catch (err) {
            console.error("Error parsing next-to-act info:", err);
            return {
                ...defaultValues,
                error: err instanceof Error ? err : new Error("Error parsing next-to-act info")
            };
        }
    }, [gameState, isLoading, error]);

    return result;
};
