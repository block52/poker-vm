import { useMemo} from "react";
import { useGameStateContext } from "../context/GameStateContext";
import { PlayerDTO, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { ShowingCardsByAddressReturn, ShowingCardData } from "../types/index";

/**
 * Custom hook to get hole cards of players who have shown their cards
 * 
 * NOTE: Player showing status and hole cards are handled through GameStateContext subscription.
 * Components call subscribeToTable(tableId) which creates a WebSocket connection with both tableAddress 
 * and playerId parameters. This hook reads the real-time showing cards data from that context.
 * 
 * @returns Object containing all players with "showing" status and their cards
 */
export const useShowingCardsByAddress = (): ShowingCardsByAddressReturn => {
  // Get game state directly from Context - real-time data via WebSocket
  const { gameState, isLoading, error } = useGameStateContext();
  
  // Check if round is showdown or end
  const isShowdown = useMemo((): boolean => {
    if (!gameState?.round) return false;
    return gameState.round === TexasHoldemRound.SHOWDOWN || gameState.round === TexasHoldemRound.END;
  }, [gameState]);
  
  // Find all players with status "showing"
  const showingPlayers = useMemo((): ShowingCardData[] => {
    if (!gameState?.players) return [];
    
    try {
      return gameState.players
        .filter((player: PlayerDTO) => 
          player.status === PlayerStatus.SHOWING && 
          player.holeCards && 
          player.holeCards.length === 2
        )
        .map((player: PlayerDTO) => ({
          address: player.address,
          holeCards: player.holeCards || [],
          seat: player.seat
        }));
    } catch (err) {
      console.error("Error filtering showing players:", err);
      return [];
    }
  }, [gameState]);
  
  return {
    showingPlayers,
    isShowdown,
    isLoading,
    error
  };
}; 