import { useGameStateContext } from "../context/GameStateContext";
import { ethers } from "ethers";
import { PlayerActionType } from "@bitcoinbrisbane/block52";

/**
 * Custom hook to get the last two bet/raise values from previous actions
 * @returns Object containing:
 * - lastBetAmount: the amount of the last bet/raise action (in USDC)
 * - secondLastBetAmount: the amount of the second last bet/raise action (in USDC)
 * - lastAction: the last action object
 * - secondLastAction: the second last action object
 * - isLoading: boolean indicating if data is being loaded
 * - error: any error that occurred during data fetching
 */
export const useLastBet = () => {
    // Get game state directly from Context - no additional WebSocket connections
    const { gameState, isLoading, error } = useGameStateContext();

    // Default values in case of error or loading
    const defaultState = {
        lastBetAmount: 0,
        secondLastBetAmount: 0,
        lastAction: null,
        secondLastAction: null,
        isLoading,
        error
    };

    // If still loading or error occurred, return default values
    if (isLoading || error || !gameState) {
        return defaultState;
    }

    try {
        const previousActions = gameState.previousActions || [];
        
        if (previousActions.length === 0) {
            return {
                lastBetAmount: 0,
                secondLastBetAmount: 0,
                lastAction: null,
                secondLastAction: null,
                isLoading: false,
                error: null
            };
        }

        // Get all actions that involved betting/raising
        const betActions = [...previousActions]
            .reverse()
            .filter(action => 
                action.action === PlayerActionType.BET || 
                action.action === PlayerActionType.RAISE ||
                action.action === PlayerActionType.CALL ||
                action.action === PlayerActionType.SMALL_BLIND ||
                action.action === PlayerActionType.BIG_BLIND
            );

        // Get the last bet action
        const lastBetAction = betActions[0];
        const lastBetAmount = lastBetAction && lastBetAction.amount 
            ? Number(ethers.formatUnits(lastBetAction.amount, 18)) 
            : 0;

        // Get the second last bet action
        const secondLastBetAction = betActions[1];
        const secondLastBetAmount = secondLastBetAction && secondLastBetAction.amount 
            ? Number(ethers.formatUnits(secondLastBetAction.amount, 18)) 
            : 0;

        return {
            lastBetAmount,
            secondLastBetAmount,
            lastAction: lastBetAction || null,
            secondLastAction: secondLastBetAction || null,
            isLoading: false,
            error: null
        };
    } catch (err) {
        console.error("Error getting last bets:", err);
        return {
            ...defaultState,
            error: err instanceof Error ? err : new Error(String(err))
        };
    }
};
