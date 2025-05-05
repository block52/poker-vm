import React from "react";
import { ethers } from "ethers";
import { PlayerStatus } from "@bitcoinbrisbane/block52";
import { useGameState } from "./useGameState";

/**
 * Custom hook to fetch player data for a specific seat
 * Uses the central useGameState hook to avoid multiple requests
 * @param tableId The ID of the table
 * @param seatIndex The seat index to get player data for
 * @returns Object with player data and utility functions
 */
export const usePlayerData = (tableId?: string, seatIndex?: number) => {
  // Use the central gameState hook instead of making a separate request
  const { gameState, isLoading, error, refresh } = useGameState(tableId, 5000);
  
  // Get player data from the table state
  const playerData = React.useMemo(() => {
    if (!gameState || !seatIndex) return null;
    
    if (!gameState.players) return null;
    
    return gameState.players.find((p: any) => p.seat === seatIndex);
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
  
  const holeCards = React.useMemo(() => {
    return playerData?.holeCards || [];
  }, [playerData]);
  
  const round = React.useMemo(() => {
    if (!gameState) return null;
    return gameState.round;
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