import { dealerPosition } from "../utils/PositionArray";
import { useGameState } from "./useGameState";

/**
 * Custom hook to fetch and provide dealer button position
 * @param tableId The ID of the table to fetch state for
 * @returns Object containing dealer button position and visibility state
 */
export const useDealerPosition = (tableId?: string) => {
  // Get game state from centralized hook
  const { gameState, isLoading, error } = useGameState(tableId);

  // Default values in case of error or loading
  const defaultState = {
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
    let dealerButtonPosition = { left: "0px", top: "0px" };
    let isDealerButtonVisible = false;

    // Handle dealer button
    if (gameState.dealer !== undefined && gameState.dealer !== null) {
      // If dealer position is 9, treat it as 0 for UI consistency
      const dealerSeat = gameState.dealer === 9 ? 0 : gameState.dealer;
      const dealerPos = dealerPosition.nine[dealerSeat];

      if (dealerPos) {
        // Set the position based on dealer's seat
        dealerButtonPosition = {
          left: dealerPos.left,
          top: dealerPos.top
        };
        isDealerButtonVisible = true;
      }
    }

    return {
      dealerButtonPosition,
      isDealerButtonVisible,
      isLoading: false,
      error: null
    };
  } catch (err) {
    console.error("Error parsing dealer position:", err);
    return {
      ...defaultState,
      error: err
    };
  }
}; 