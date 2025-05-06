import { useState, useCallback, useMemo, useEffect } from "react";
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { PlayerDTO } from "@bitcoinbrisbane/block52";
import { useGameState } from "./useGameState";

// Type for cached user data
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
  // Get user address from local storage
  const userWalletAddress = useMemo(() => {
    const address = localStorage.getItem("user_eth_public_key");
    return address ? address.toLowerCase() : null;
  }, []);

  // State for user data by seat
  const [userDataBySeat, setUserDataBySeat] = useState<Record<number, CachedUserData>>({});
  const [currentUserSeat, setCurrentUserSeat] = useState<number>(-1);

  // Get game state from centralized hook
  const { gameState, isLoading, error, refresh } = useGameState(tableId);

  // Update current user's seat when table data changes
  useEffect(() => {
    if (!isLoading && !error && gameState && userWalletAddress) {
      try {
        if (!gameState.players) {
          return;
        }

        // Find the player with matching address
        const player = gameState.players.find(
          (p: PlayerDTO) => p.address?.toLowerCase() === userWalletAddress
        );
        
        // Update current user's seat
        setCurrentUserSeat(player ? player.seat : -1);
      } catch (err) {
        console.error("Error finding current user seat:", err);
      }
    }
  }, [gameState, isLoading, error, userWalletAddress]);

  // Fetch user data by seat
  const fetchUserBySeat = useCallback(
    async (seat: number) => {
      if (!tableId || seat < 0) return null;

      try {
        // Check if we already have cached data and it's not stale
        const cachedData = userDataBySeat[seat];
        const isStale = !cachedData || (cachedData.lastFetched && Date.now() - cachedData.lastFetched > 30000); // Refresh every 30 seconds

        // If we have non-stale data, use it
        if (cachedData && !isStale) {
          return cachedData.data;
        }

        const response = await axios.get(`${PROXY_URL}/table/${tableId}/player/${seat}`);

        // Update the cache with new data and timestamp
        setUserDataBySeat(prev => ({
          ...prev,
          [seat]: {
            data: response.data,
            lastFetched: Date.now()
          }
        }));

        return response.data;
      } catch (error) {
        console.error(`Error fetching user data for seat ${seat}:`, error);
        return null;
      }
    },
    [tableId, userDataBySeat]
  );

  // Helper function to get user data by seat (from cache or fetch if needed)
  const getUserBySeat = useCallback(
    (seat: number) => {
      const cachedData = userDataBySeat[seat];

      // If we don't have data or it's stale, trigger a fetch
      if (!cachedData || (cachedData.lastFetched && Date.now() - cachedData.lastFetched > 30000)) {
        fetchUserBySeat(seat);
      }

      return cachedData?.data || null;
    },
    [userDataBySeat, fetchUserBySeat]
  );

  // Initial fetch for current user's seat data
  useEffect(() => {
    if (currentUserSeat >= 0 && tableId) {
      fetchUserBySeat(currentUserSeat);
    }
  }, [currentUserSeat, tableId, fetchUserBySeat]);

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

  console.log("[usePlayerSeatInfo] Returns:", {
    currentUserSeat: result.currentUserSeat,
    numCachedSeats: Object.keys(result.userDataBySeat).length,
    cachedSeats: Object.keys(result.userDataBySeat),
    isLoading: result.isLoading,
    hasError: !!result.error
  });

  return result;
};
