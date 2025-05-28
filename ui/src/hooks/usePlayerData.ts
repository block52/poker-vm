import React from "react";
import { ethers } from "ethers";
import { PlayerStatus, PlayerDTO } from "@bitcoinbrisbane/block52";
import { PlayerDataReturn } from "../types/index";
import { useGameStateContext } from "../context/GameStateContext";

/**
 * Custom hook to fetch player data for a specific seat
 * 
 * SIMPLIFIED: Uses GameStateContext directly instead of useGameState
 * This prevents creating multiple WebSocket connections for the same table
 * 
 * @param tableId The ID of the table (not used - Context manages subscription)
 * @param seatIndex The seat index to get player data for
 * @returns Object with player data and utility functions
 */
export const usePlayerData = (tableId?: string, seatIndex?: number): PlayerDataReturn => {
  // Get game state directly from Context - no additional WebSocket connections
  const { gameState, error, isLoading } = useGameStateContext();
  
  // Get player data from the table state
  const playerData = React.useMemo((): PlayerDTO | null => {
    if (!gameState || !seatIndex) {
      return null;
    }
    
    if (!gameState.players) {
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

  // Manual refresh function (no-op since WebSocket provides real-time data)
  const refresh = React.useCallback(async () => {
    console.log("Refresh called - WebSocket provides real-time data, no manual refresh needed");
    return gameState;
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