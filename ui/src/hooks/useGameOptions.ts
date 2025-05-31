import { useMemo } from "react";
import { useGameStateContext } from "../context/GameStateContext";
import { GameOptionsDTO } from "@bitcoinbrisbane/block52";
import { GameOptionsReturn } from "../types/index";

/**
 * Custom hook to fetch game options for a table
 * 
 * NOTE: Game options are handled through GameStateContext subscription.
 * Components call subscribeToTable(tableId) which creates a WebSocket connection with both tableAddress 
 * and playerId parameters. This hook reads the real-time game options from that context.
 * 
 * @returns Object containing game options and loading state - no defaults, returns actual values from server
 */
export const useGameOptions = (): GameOptionsReturn => {
    // Get game state directly from Context - real-time data via WebSocket
    const { gameState, isLoading, error } = useGameStateContext();

    // Memoize game options processing - no defaults, use actual server values
    const gameOptions = useMemo((): Required<GameOptionsDTO> | null => {
        if (!gameState?.gameOptions) {
            return null;
        }

        try {
            const options = gameState.gameOptions;
            
            // Only return options if we have the required fields
            if (!options.smallBlind || !options.bigBlind || !options.timeout) {
                console.warn("Missing required game options from server");
                return null;
            }
            
            // Return the actual game options from the server
            return {
                minBuyIn: options.minBuyIn || "0",
                maxBuyIn: options.maxBuyIn || "0", 
                maxPlayers: options.maxPlayers || 9,
                minPlayers: options.minPlayers || 2,
                smallBlind: options.smallBlind,
                bigBlind: options.bigBlind,
                timeout: options.timeout
            };
        } catch (err) {
            console.error("Error parsing game options:", err);
            return null;
        }
    }, [gameState]);

    return {
        gameOptions,
        isLoading,
        error
    };
};
