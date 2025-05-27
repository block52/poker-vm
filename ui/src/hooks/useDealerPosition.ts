import { useGameState } from "./useGameState";
import { DealerPositionReturn } from "../types/index";
import { dealerPosition } from "../utils/PositionArray";

/**
 * Custom hook to fetch and provide dealer button position
 * @param tableId The ID of the table to fetch state for
 * @returns Object containing dealer button position and visibility state
 */
export const useDealerPosition = (tableId?: string): DealerPositionReturn => {
    // Use the centralized game state hook
    const { gameState, isLoading, error } = useGameState(tableId);

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
        // Get dealer seat from game state
        const dealerSeat = gameState.dealer;
        
        // Debug logging to see what we're getting
        console.log("🎯 Dealer Position Debug:", {
            dealerSeat,
            gameStateDealer: gameState.dealer,
            tableSize: gameState.gameOptions?.maxPlayers
        });
        
        // Default position if no dealer seat is set
        let dealerButtonPosition = { left: "0px", top: "0px" };
        let isDealerButtonVisible = false;

        if (dealerSeat && dealerSeat > 0) {
            // Get table size from game state (maxPlayers determines table layout)
            const tableSize: number = gameState.gameOptions?.maxPlayers || 9;
            
            // Convert dealer seat number to dealer position array index
            // The dealerPosition array in PositionArray.tsx is indexed as follows:
            // - Index 0: Dealer Position 9 (bottom right)
            // - Index 1: Dealer Position 1 (bottom left) 
            // - Index 2: Dealer Position 2 (left side)
            // - Index 3-8: Dealer Positions 3-8 (continuing clockwise)
            //
            // This mapping exists because seat 9 is considered the "button" position
            // in poker and is placed at index 0 for visual layout purposes.
            let dealerIndex;
            if (dealerSeat === 9) {
                dealerIndex = 0; // Seat 9 maps to index 0 (button position)
            } else {
                dealerIndex = dealerSeat; // Seats 1-8 map directly to indices 1-8
            }
            
            // Get position from dealer position array based on table size
            const positions = tableSize === 6 ? dealerPosition.six : dealerPosition.nine;
            
            console.log("🎯 Dealer Position Calculation:", {
                dealerSeat,
                dealerIndex,
                tableSize,
                positionsLength: positions.length,
                selectedPosition: positions[dealerIndex]
            });
            
            if (dealerIndex < positions.length) {
                dealerButtonPosition = {
                    left: positions[dealerIndex].left || "0px",
                    top: positions[dealerIndex].top || "0px"
                };
                isDealerButtonVisible = true;
                
                console.log("🎯 Final Dealer Button Position:", dealerButtonPosition);
            }
        }

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
