import React from "react";
import { PlayerStatus, PlayerDTO } from "@block52/poker-vm-sdk";
import { PlayerDataReturn } from "../types/index";
import { useGameStateContext } from "../context/GameStateContext";
import { convertUSDCToNumber } from "../utils/numberUtils";

/**
 * Custom hook to fetch player data for a specific seat
 * 
 * NOTE: Player data is handled through GameStateContext subscription.
 * Components call subscribeToTable(tableId) which creates a WebSocket connection with both tableAddress 
 * and playerId parameters. This hook reads the real-time player data from that context.
 * 
 * @param seatIndex The seat index to get player data for
 * @returns Object with player data and utility functions
 */
export const usePlayerData = (seatIndex?: number): PlayerDataReturn => {
  // Get game state directly from Context - real-time data via WebSocket
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

    // Debug logging for seat mapping
    console.log(`🔍 usePlayerData - Looking for seat ${seatIndex}: ` + JSON.stringify({
      requestedSeat: seatIndex,
      foundPlayer: player ? {
        address: player.address,
        seat: player.seat,
        stack: player.stack,
        status: player.status
      } : null,
      allPlayers: gameState.players.map((p: PlayerDTO) => ({
        seat: p.seat,
        address: p.address?.substring(0, 10) + "...",
        stack: p.stack
      }))
    }, null, 2));

    return player || null;
  }, [gameState, seatIndex]);
  
  // Format stack value from Cosmos microunits (6 decimals, not 18!)
  const stackValue = React.useMemo((): number => {
    if (!playerData?.stack) {
      console.log(`⚠️ usePlayerData - No stack for seat ${seatIndex}:`, {
        hasPlayerData: !!playerData,
        stackValue: playerData?.stack,
        stackType: typeof playerData?.stack
      });
      return 0;
    }

    // Convert USDC microunits to number using utility function
    const converted = convertUSDCToNumber(playerData.stack);
    console.log(`💰 usePlayerData - Stack conversion for seat ${seatIndex}:`, {
      rawStack: playerData.stack,
      stackType: typeof playerData.stack,
      convertedValue: converted,
      note: "Using convertUSDCToNumber utility (6 decimals)"
    });

    return converted;
  }, [playerData, seatIndex]);
  
  // Calculate derived properties
  const isFolded = React.useMemo((): boolean => {
    return playerData?.status === PlayerStatus.FOLDED;
  }, [playerData]);
  
  const isAllIn = React.useMemo((): boolean => {
    return playerData?.status === PlayerStatus.ALL_IN;
  }, [playerData]);
  
  const isSittingOut = React.useMemo((): boolean => {
    return playerData?.status === PlayerStatus.SITTING_OUT;
  }, [playerData]);
  
  const isBusted = React.useMemo((): boolean => {
    return playerData?.status === PlayerStatus.BUSTED;
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
    isSittingOut,
    isBusted,
    holeCards,
    round,
    isLoading,
    error
  };
}; 