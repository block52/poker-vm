import React from "react";
import { ethers } from "ethers";
import { PlayerStatus } from "@bitcoinbrisbane/block52";
import { useGameState } from "./useGameState";

/**
 * Custom hook to fetch player data for a specific seat
 * @param tableId The ID of the table
 * @param seatIndex The seat index to get player data for
 * @returns Object with player data and utility functions
 */
export const usePlayerData = (tableId?: string, seatIndex?: number) => {
  // Use useGameState hook instead of making our own API call
  const { gameState, error, isLoading, refresh } = useGameState(tableId);
  
  // Cache for last valid hole cards (like community cards approach)
  const lastValidHoleCardsRef = React.useRef<string[]>([]);
  const lastRoundRef = React.useRef<string | null>(null);
  
  // Get player data from the table state
  const playerData = React.useMemo(() => {
    if (!gameState || !seatIndex) {
      console.log(`No player data - gameState exists: ${!!gameState}, seatIndex: ${seatIndex}`);
      return null;
    }
    
    if (!gameState.players) {
      console.log("Game state has no players array");
      return null;
    }
    
    const player = gameState.players.find((p) => p.seat === seatIndex);
    
    
    return player || null;
  }, [gameState, seatIndex]);
  
  // Format stack value with ethers.js (more accurate for large numbers)
  const stackValue = React.useMemo(() => {
    if (!playerData?.stack) return 0;
    return Number(ethers.formatUnits(playerData.stack, 18));
  }, [playerData]);
  
  // Calculate derived properties
  const isFolded = React.useMemo(() => {
    return playerData?.status === PlayerStatus.FOLDED;
  }, [playerData]);
  
  const isAllIn = React.useMemo(() => {
    return playerData?.status === PlayerStatus.ALL_IN;
  }, [playerData]);
  
  // Get current round
  const round = React.useMemo(() => {
    return gameState?.round || null;
  }, [gameState]);
  
  // Persistent hole cards with round-based clearing
  const holeCards = React.useMemo(() => {
    const currentCards = playerData?.holeCards;
    const currentRound = round;
    
    // Clear cached cards when transitioning from end to ante (new hand)
    if (lastRoundRef.current === "end" && currentRound === "ante") {
      console.log(`🎴 Clearing cached cards for new hand - Round: ${currentRound}`);
      lastValidHoleCardsRef.current = [];
    }
    
    // Update round reference
    lastRoundRef.current = currentRound;
    
    // If we have valid current cards, cache them and return
    // IMPORTANT: Reject placeholder cards (??) - only cache real card values
    if (currentCards && Array.isArray(currentCards) && currentCards.length === 2) {
      const isValidCards = currentCards.every(card => 
        typeof card === "string" && 
        card !== "??" && 
        card.length >= 2 && 
        !card.includes("?")
      );
      
      if (isValidCards) {
        console.log(`🎴 Caching new cards: ${currentCards[0]}, ${currentCards[1]}`);
        lastValidHoleCardsRef.current = [...currentCards];
        return lastValidHoleCardsRef.current;
      } else {
        console.log(`🎴 Rejecting placeholder cards: ${currentCards[0]}, ${currentCards[1]}`);
      }
    }
    
    // Otherwise, return last valid cards (or empty array if cleared/never had any)
    return lastValidHoleCardsRef.current;
  }, [playerData, round]);
  
  return {
    playerData,
    stackValue,
    isFolded,
    isAllIn,
    holeCards,
    round,
    isLoading,
    error,
    refresh
  };
}; 