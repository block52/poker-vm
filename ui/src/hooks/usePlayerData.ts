import React from "react";
import { ethers } from "ethers";
import { PlayerStatus, PlayerDTO } from "@bitcoinbrisbane/block52";
import { useGameState } from "./useGameState";
import { PlayerDataReturn, GameStateReturn } from "../types/index";

/**
 * Custom hook to fetch player data for a specific seat
 * @param tableId The ID of the table
 * @param seatIndex The seat index to get player data for
 * @returns Object with player data and utility functions
 */
export const usePlayerData = (tableId?: string, seatIndex?: number): PlayerDataReturn => {
  // Use useGameState hook instead of making our own API call
  const { gameState, error, isLoading, refresh }: GameStateReturn = useGameState(tableId);
  
  // Get player data from the table state
  const playerData = React.useMemo((): PlayerDTO | null => {
    if (!gameState || !seatIndex) {
      console.log(`No player data - gameState exists: ${!!gameState}, seatIndex: ${seatIndex}`);
      return null;
    }
    
    if (!gameState.players) {
      console.log("Game state has no players array");
      return null;
    }
    
    const player = gameState.players.find((p: PlayerDTO) => p.seat === seatIndex);
    
    return player || null;
  }, [gameState, seatIndex]);
  
  // Format stack value with ethers.js (more accurate for large numbers)
  const stackValue = React.useMemo((): number => {
    if (!playerData?.stack) return 0;
    return Number(ethers.formatUnits(playerData.stack, 18));
  }, [playerData]);
  
  // Calculate derived properties
  const isFolded = React.useMemo((): boolean => {
    return playerData?.status === PlayerStatus.FOLDED;
  }, [playerData]);
  
  const isAllIn = React.useMemo((): boolean => {
    return playerData?.status === PlayerStatus.ALL_IN;
  }, [playerData]);
  
  const holeCards = React.useMemo((): string[] => {
    return playerData?.holeCards || [];
  }, [playerData]);
  
  const round = React.useMemo(() => {
    return gameState?.round || null;
  }, [gameState]);
  
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