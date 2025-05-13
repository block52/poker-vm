import { useGameState } from "./useGameState";

/**
 * Interface for showing cards data
 */
interface ShowingCardData {
  address: string;
  holeCards: string[];
  seat: number;
}

/**
 * Custom hook to get hole cards of players who have shown their cards
 * @param tableId The ID of the table to check
 * @returns Object containing all players with "showing" status and their cards
 */
export const useShowingCardsByAddress = (tableId?: string) => {
  // Get game state from centralized hook
  const { gameState, isLoading, error, refresh } = useGameState(tableId);
  
  // Default return value
  const defaultValue = {
    showingPlayers: [] as ShowingCardData[],
    isShowdown: false,
    isLoading,
    error,
    refresh
  };
  
  // If still loading or error occurred, return default values
  if (isLoading || error || !gameState) {
    return defaultValue;
  }
  
  try {
    // Check if round is showdown or end
    const isShowdown = gameState.round === "showdown" || gameState.round === "end";
    
    // Find all players with status "showing"
    const showingPlayers = gameState.players
      ?.filter((player: any) => 
        player.status === "showing" && 
        player.holeCards && 
        player.holeCards.length === 2
      )
      .map((player: any) => ({
        address: player.address,
        holeCards: player.holeCards,
        seat: player.seat
      })) || [];
    
    return {
      showingPlayers,
      isShowdown,
      isLoading: false,
      error: null,
      refresh
    };
  } catch (err) {
    console.error("Error getting showing cards:", err);
    return {
      ...defaultValue,
      error: err
    };
  }
}; 