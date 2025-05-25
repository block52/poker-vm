import { useCallback, useMemo, useState, useEffect } from "react";
import { PlayerDTO } from "@bitcoinbrisbane/block52";
import { useGameState } from "./useGameState";

// Type for cached user data - keep for consistent API
interface CachedUserData {
  data: any;
  lastFetched: number;
}

/**
 * Custom hook to manage player seat information
 * @param tableId The ID of the table
 * @returns Object containing player seat information and related functions
 */
export const usePlayerSeatInfo = (tableId?: string) => {
  // Use centralized game state from WebSocket
  const { gameState, isLoading, error, refresh } = useGameState(tableId);
  
  // Get user address from local storage
  const userWalletAddress = useMemo(() => {
    const address = localStorage.getItem("user_eth_public_key");
    return address ? address.toLowerCase() : null;
  }, []);
  
  // State for user data by seat (for backward compatibility)
  const [userDataBySeat, setUserDataBySeat] = useState<Record<number, CachedUserData>>({});
  const [currentUserSeat, setCurrentUserSeat] = useState<number>(-1);

  // Update seat information when game state changes
  useEffect(() => {
    if (!gameState || !userWalletAddress) {
      setCurrentUserSeat(-1);
      setUserDataBySeat({});
      return;
    }

    // Find the player with matching address to determine current user's seat
    const player = gameState.players?.find(
      (p: PlayerDTO) => p.address?.toLowerCase() === userWalletAddress
    );
    
    // Update current user's seat
    const newSeat = player ? player.seat : -1;
    setCurrentUserSeat(newSeat);

    // update userDataBySeat
    if (gameState.players && gameState.players.length > 0) {
      const newUserDataBySeat: Record<number, CachedUserData> = {};
      
      gameState.players.forEach((player: PlayerDTO) => {
        if (player.seat >= 0) {
          newUserDataBySeat[player.seat] = {
            data: player,
            lastFetched: Date.now()
          };
        }
      });
      
      setUserDataBySeat(newUserDataBySeat);
    }
  }, [gameState, userWalletAddress]);

  // Helper function to get user data by seat (from cache)
  const getUserBySeat = useCallback(
    (seat: number) => {
      const cachedData = userDataBySeat[seat];
      
      // If we have data, use it
      if (cachedData) {
        return cachedData.data;
      }
      
      // If player data exists in the current gameState, return it
      if (gameState && gameState.players) {
        const player = gameState.players.find((p: PlayerDTO) => p.seat === seat);
        if (player) {
          return player;
        }
      }
      
      return null;
    },
    [userDataBySeat, gameState]
  );

  // Create the result object
  const result = {
    currentUserSeat,
    userDataBySeat: useMemo(() => {
      // Convert Record<number, CachedUserData> to Record<number, any> (just the data)
      const result: Record<number, any> = {};
      Object.entries(userDataBySeat).forEach(([key, value]) => {
        result[Number(key)] = value.data;
      });
      return result;
    }, [userDataBySeat]),
    getUserBySeat,
    isLoading,
    error,
    refresh
  };

  return result;
};
