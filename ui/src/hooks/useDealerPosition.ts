import { useGameState } from "./useGameState";
import { DealerPositionReturn, GameStateReturn } from "../types/index";

/**
 * Custom hook to fetch and provide dealer button position
 * @param tableId The ID of the table to fetch state for
 * @returns Object containing dealer button position and visibility state
 */
export const useDealerPosition = (tableId?: string): DealerPositionReturn => {
    // Get game state from centralized hook
    const { gameState, isLoading, error }: GameStateReturn = useGameState(tableId);

    // Default values in case of error or loading
    const defaultState: DealerPositionReturn = {
        dealerButtonPosition: { left: "0px", top: "0px" },
        isDealerButtonVisible: false,
        isLoading,
        error
    };

    // If still loading or error occurred, return default values
    if (isLoading || error || !gameState) {
        return defaultState;
    }

    try {
        // Default state if dealer position isn't set
        const dealerButtonPosition = { left: "0px", top: "0px" };
        const isDealerButtonVisible = true;

        const data: DealerPositionReturn = {
            dealerButtonPosition,
            isDealerButtonVisible,
            isLoading: false,
            error: null
        };

        return data;
    } catch (err) {
        console.error("Error parsing dealer position:", err);
        return {
            ...defaultState,
            error: err as Error
        };
    }
};
