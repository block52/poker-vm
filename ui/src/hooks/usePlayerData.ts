import React from "react";
import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { ethers } from "ethers";
import { PlayerStatus } from "@bitcoinbrisbane/block52";

// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => res.data);

/**
 * Custom hook to fetch player data for a specific seat
 * @param tableId The ID of the table
 * @param seatIndex The seat index to get player data for
 * @returns Object with player data and utility functions
 */
export const usePlayerData = (tableId?: string, seatIndex?: number) => {
  // Skip the request if no tableId is provided
  const { data, error, isLoading } = useSWR(
    tableId ? `${PROXY_URL}/get_game_state/${tableId}` : null,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true
    }
  );
  
  // Get player data from the table state
  const playerData = React.useMemo(() => {
    if (!data || !seatIndex) return null;
    
    // Extract table data from the response (handling different API response structures)
    const tableData = data.data || data;
    
    if (!tableData?.players) return null;
    
    return tableData.players.find((p: any) => p.seat === seatIndex);
  }, [data, seatIndex]);
  
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
    if (!data) return null;
    const tableData = data.data || data;
    return tableData?.round;
  }, [data]);
  
  return {
    playerData,
    stackValue,
    isFolded,
    isAllIn,
    holeCards,
    round,
    isLoading,
    error
  };
}; 