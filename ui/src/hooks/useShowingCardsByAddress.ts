import { useMemo } from "react";
import { useGameState } from "./useGameState";
import { PlayerDTO, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { ShowingCardsByAddressReturn, ShowingCardData, GameStateReturn } from "../types/index";

/**
 * Custom hook to get hole cards of players who have shown their cards
 * @param tableId The ID of the table to check
 * @returns Object containing all players with "showing" status and their cards
 */
export const useShowingCardsByAddress = (tableId?: string): ShowingCardsByAddressReturn => {
  // Get game state from centralized hook
  const { gameState, isLoading, error, refresh }: GameStateReturn = useGameState(tableId);
  
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
    error,
    refresh
  };
}; 