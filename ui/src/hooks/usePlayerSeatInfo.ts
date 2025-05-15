import { useState, useCallback, useMemo, useEffect } from "react";
import { PlayerDTO, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../context/NodeRpcContext";

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
  // Get NodeRpc client
  const { client, isLoading: clientLoading } = useNodeRpc();
  
  // Get user address from local storage
  const userWalletAddress = useMemo(() => {
    const address = localStorage.getItem("user_eth_public_key");
    return address ? address.toLowerCase() : null;
  }, []);

  // State for the game state - using the SDK type directly
  const [gameState, setGameState] = useState<TexasHoldemStateDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // State for user data by seat (for backward compatibility)
  const [userDataBySeat, setUserDataBySeat] = useState<Record<number, CachedUserData>>({});
  const [currentUserSeat, setCurrentUserSeat] = useState<number>(-1);

  // Function to fetch game state
  const fetchGameState = useCallback(async () => {
    if (!client || !tableId || !userWalletAddress) {
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await client.getGameState(tableId, userWalletAddress);
      setGameState(response);
      setError(null);

      // Find the player with matching address to determine current user's seat
      const player = response.players?.find(
        (p: PlayerDTO) => p.address?.toLowerCase() === userWalletAddress
      );
      
      // Update current user's seat
      const newSeat = player ? player.seat : -1;
      setCurrentUserSeat(newSeat);

      // For backward compatibility, update userDataBySeat
      if (response.players && response.players.length > 0) {
        const newUserDataBySeat: Record<number, CachedUserData> = {};
        
        response.players.forEach((player: PlayerDTO) => {
          if (player.seat >= 0) {
            newUserDataBySeat[player.seat] = {
              data: player,
              lastFetched: Date.now()
            };
          }
        });
        
        setUserDataBySeat(newUserDataBySeat);
      }
    } catch (err) {
      console.error("[usePlayerSeatInfo] Error fetching game state:", err);
      setError(err instanceof Error ? err : new Error("Unknown error fetching game state"));
    } finally {
      setIsLoading(false);
    }
  }, [client, tableId, userWalletAddress]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    if (tableId && client && !clientLoading && userWalletAddress) {
      fetchGameState();
      
      // Set up periodic refresh (every 60 seconds)
      const intervalId = setInterval(fetchGameState, 60000);
      
      return () => clearInterval(intervalId);
    } else if (!clientLoading && !tableId) {
      setIsLoading(false);
    }
  }, [tableId, client, clientLoading, userWalletAddress, fetchGameState]);

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
    isLoading: isLoading || clientLoading,
    error,
    refresh: fetchGameState
  };

  return result;
};
