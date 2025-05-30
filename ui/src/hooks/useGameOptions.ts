import { useMemo } from "react";
import { useGameStateContext } from "../context/GameStateContext";
import { GameOptionsDTO } from "@bitcoinbrisbane/block52";
import { GameOptionsReturn } from "../types/index";

// Define default values as strings (matching GameOptionsDTO)
export const DEFAULT_SMALL_BLIND = "100000000000000000"; // 0.1 ETH
export const DEFAULT_BIG_BLIND = "200000000000000000"; // 0.2 ETH
export const DEFAULT_MIN_BUY_IN = "10000000000000000000"; // 10 ETH
export const DEFAULT_MAX_BUY_IN = "100000000000000000000"; // 100 ETH

// Default options using Required<GameOptionsDTO> format
const defaultOptions: Required<GameOptionsDTO> = {
    minBuyIn: DEFAULT_MIN_BUY_IN,
    maxBuyIn: DEFAULT_MAX_BUY_IN,
    maxPlayers: 9,
    minPlayers: 2,
    smallBlind: DEFAULT_SMALL_BLIND,
    bigBlind: DEFAULT_BIG_BLIND,
    timeout: 300
};

/**
 * Custom hook to fetch game options for a table
 * 
 * NOTE: Game options are handled through GameStateContext subscription.
 * Components call subscribeToTable(tableId) which creates a WebSocket connection with both tableAddress 
 * and playerId parameters. This hook reads the real-time game options from that context.
 * 
 * @returns Object containing game options and loading state
 */
export const useGameOptions = (): GameOptionsReturn => {
    // Get game state directly from Context - real-time data via WebSocket
    const { gameState, isLoading, error } = useGameStateContext();

    // Memoize game options processing
    const gameOptions = useMemo((): Required<GameOptionsDTO> => {
        if (!gameState?.gameOptions) {
            return defaultOptions;
        }

        try {
            const options = gameState.gameOptions;
            
            // Use the game options from the API with fallbacks to defaults
            // Ensure all properties are present and not undefined
            return {
                minBuyIn: options.minBuyIn ?? defaultOptions.minBuyIn,
                maxBuyIn: options.maxBuyIn ?? defaultOptions.maxBuyIn,
                maxPlayers: options.maxPlayers ?? defaultOptions.maxPlayers,
                minPlayers: options.minPlayers ?? defaultOptions.minPlayers,
                smallBlind: options.smallBlind ?? defaultOptions.smallBlind,
                bigBlind: options.bigBlind ?? defaultOptions.bigBlind,
                timeout: options.timeout ?? defaultOptions.timeout
            };
        } catch (err) {
            console.error("Error parsing game options:", err);
            return defaultOptions;
        }
    }, [gameState]);

    return {
        gameOptions,
        isLoading,
        error
    };
};
