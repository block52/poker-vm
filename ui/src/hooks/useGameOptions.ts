import { useGameState } from "./useGameState";
import { GameOptions } from "@bitcoinbrisbane/block52";
import { useEffect, useState } from "react";

// Define default values
export const DEFAULT_SMALL_BLIND = "100000000000000000"; // 0.1 ETH
export const DEFAULT_BIG_BLIND = "200000000000000000"; // 0.2 ETH
export const DEFAULT_MIN_BUY_IN = "10000000000000000"; // 0.01 ETH
export const DEFAULT_MAX_BUY_IN = "1000000000000000000"; // 1 ETH

/**
 * Custom hook to fetch game options for a table
 * @param tableId The table ID to fetch options for
 * @returns Object containing game options and loading state
 */
export const useGameOptions = (tableId?: string) => {
    // Default values in case of error or loading
    const defaultOptions: GameOptions = {
        minBuyIn: BigInt(DEFAULT_MIN_BUY_IN),
        maxBuyIn: BigInt(DEFAULT_MAX_BUY_IN),
        maxPlayers: 9,
        minPlayers: 2,
        smallBlind: BigInt(DEFAULT_SMALL_BLIND),
        bigBlind: BigInt(DEFAULT_BIG_BLIND),
        timeout: 300
    };

    // Use centralized game state but with custom refresh values
    const [options, setOptions] = useState<GameOptions>(defaultOptions);
    const { gameState, isLoading, error, refresh } = useGameState(tableId);

    // Store refresh time to limit how often we check for game option changes
    const [lastRefreshTime, setLastRefreshTime] = useState(0);

    // Process game options when game state changes
    useEffect(() => {
        // Only update if we have gameState and enough time has passed (30s interval)
        const now = Date.now();
        if (gameState && (!lastRefreshTime || now - lastRefreshTime > 30000)) {
            try {
                const gameOptions = gameState.gameOptions;

                if (!gameOptions) {
                    console.warn("No game options found in table data");
                    return;
                }

                // Use the game options from the API with fallbacks to defaults
                const newOptions: GameOptions = {
                    minBuyIn: gameOptions.minBuyIn || defaultOptions.minBuyIn,
                    maxBuyIn: gameOptions.maxBuyIn || defaultOptions.maxBuyIn,
                    maxPlayers: gameOptions.maxPlayers || defaultOptions.maxPlayers,
                    minPlayers: gameOptions.minPlayers || defaultOptions.minPlayers,
                    smallBlind: gameOptions.smallBlind || defaultOptions.smallBlind,
                    bigBlind: gameOptions.bigBlind || defaultOptions.bigBlind,
                    timeout: gameOptions.timeout || defaultOptions.timeout
                };

                setOptions(newOptions);
                setLastRefreshTime(now);
            } catch (err) {
                console.error("Error parsing game options:", err);
            }
        }
    }, [gameState, lastRefreshTime]);

    // If still loading or error occurred, return default values
    if (isLoading || error || !gameState) {
        return {
            gameOptions: defaultOptions,
            isLoading,
            error,
            refresh
        };
    }

    return {
        gameOptions: options,
        isLoading,
        error,
        refresh
    };
};
