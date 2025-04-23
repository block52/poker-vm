import React from "react";
import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { ethers } from "ethers";

// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => res.data);

/**
 * Custom hook to manage data for vacant seats
 * @param tableId The ID of the table
 * @returns Object containing seat vacancy data
 */
export const useVacantSeatData = (tableId?: string) => {
  // Skip the request if no tableId is provided
  const { data, error, isLoading } = useSWR(
    tableId ? `${PROXY_URL}/get_game_state/${tableId}` : null,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true
    }
  );
  
  const userAddress = React.useMemo(() => {
    return localStorage.getItem("user_eth_public_key")?.toLowerCase() || null;
  }, []);
  
  // Check if user is already playing at the table
  const isUserAlreadyPlaying = React.useMemo(() => {
    if (!userAddress || !data) return false;
    
    const tableData = data.data || data;
    if (!tableData?.players) return false;
    
    return tableData.players.some((player: any) => 
      player.address?.toLowerCase() === userAddress
    );
  }, [data, userAddress]);
  
  // Get blind values from table data
  const tableInfo = React.useMemo(() => {
    if (!data) return {
      smallBlindWei: "0",
      bigBlindWei: "0",
      smallBlindDisplay: "0.00",
      bigBlindDisplay: "0.00",
      dealerPosition: 0,
      smallBlindPosition: 0,
      bigBlindPosition: 0,
      players: []
    };
    
    const tableData = data.data || data;
    
    const smallBlindWei = tableData?.smallBlind || "0";
    const bigBlindWei = tableData?.bigBlind || "0";
    
    return {
      smallBlindWei,
      bigBlindWei,
      smallBlindDisplay: ethers.formatUnits(smallBlindWei, 18),
      bigBlindDisplay: ethers.formatUnits(bigBlindWei, 18),
      dealerPosition: tableData?.dealer || 0,
      smallBlindPosition: tableData?.smallBlindPosition || 0,
      bigBlindPosition: tableData?.bigBlindPosition || 0,
      players: tableData?.players || []
    };
  }, [data]);
  
  // Function to check if a specific seat is vacant
  const isSeatVacant = React.useCallback((seatIndex: number) => {
    if (!data) return true;
    
    const tableData = data.data || data;
    if (!tableData?.players) return true;
    
    // Check if any player occupies this seat
    const isOccupied = tableData.players.some(
      (player: any) => 
        player.seat === seatIndex && 
        player.address && 
        player.address !== "0x0000000000000000000000000000000000000000"
    );
    
    return !isOccupied;
  }, [data]);
  
  // Function to check if a user can join a specific seat
  const canJoinSeat = React.useCallback((seatIndex: number) => {
    // User can join if:
    // 1. The seat is vacant
    // 2. The user is not already playing
    return isSeatVacant(seatIndex) && !isUserAlreadyPlaying;
  }, [isSeatVacant, isUserAlreadyPlaying]);
  
  return {
    isUserAlreadyPlaying,
    tableInfo,
    isSeatVacant,
    canJoinSeat,
    isLoading,
    error
  };
}; 