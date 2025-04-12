import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { PlayerActionType, NonPlayerActionType } from "@bitcoinbrisbane/block52";


// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => res.data);

// Type definitions for better type safety
export interface LegalAction {
  action: string;  // "fold", "check", "bet", etc.
  min: string;     // Min amount as string (in wei)
  max: string;     // Max amount as string (in wei)
  index: number;   // Action index
}

interface PlayerLegalActionsResult {
  legalActions: LegalAction[];
  isSmallBlindPosition: boolean;
  isBigBlindPosition: boolean;
  isDealerPosition: boolean;
  isPlayerTurn: boolean;
  playerStatus: string | null;
  playerSeat: number | null;
  isLoading: boolean;
  error: any;
  refresh: () => void;
}

/**
 * Custom hook to fetch the legal actions for the current player
 * @param tableId The table ID
 * @returns Object containing the player's legal actions and related information
 */
export function usePlayerLegalActions(tableId?: string): PlayerLegalActionsResult {
  // Get the user's address from localStorage
  const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();
  
  // Fetch game state using SWR
  const { data, error, isLoading, mutate } = useSWR(
    tableId ? `${PROXY_URL}/get_game_state/${tableId}` : null,
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true,
      dedupingInterval: 2000, // Dedupe similar requests within 2 seconds
    }
  );

  // Default return value for error/loading states
  const defaultReturn: PlayerLegalActionsResult = {
    legalActions: [],
    isSmallBlindPosition: false,
    isBigBlindPosition: false,
    isDealerPosition: false,
    isPlayerTurn: false,
    playerStatus: null,
    playerSeat: null,
    isLoading,
    error,
    refresh: mutate
  };

  // Handle loading and error states
  if (isLoading || error || !data || !data.data) {
    return defaultReturn;
  }

  try {
    // Find the current player in the table data
    const gameData = data.data;
    const currentPlayer = gameData.players?.find(
      (player: any) => player.address?.toLowerCase() === userAddress
    );

    // If player is not at the table, return default
    if (!currentPlayer) {
      return defaultReturn;
    }

    // Check if it's the player's turn
    const isPlayerTurn = gameData.nextToAct === currentPlayer.seat;
    
    // Extract and return all the relevant information
    return {
      legalActions: currentPlayer.legalActions || [],
      isSmallBlindPosition: currentPlayer.isSmallBlind || gameData.smallBlindPosition === currentPlayer.seat,
      isBigBlindPosition: currentPlayer.isBigBlind || gameData.bigBlindPosition === currentPlayer.seat,
      isDealerPosition: currentPlayer.isDealer || gameData.dealer === currentPlayer.seat,
      isPlayerTurn,
      playerStatus: currentPlayer.status || null,
      playerSeat: currentPlayer.seat || null,
      isLoading: false,
      error: null,
      refresh: mutate
    };
  } catch (err) {
    console.error("Error parsing player legal actions:", err);
    return {
      ...defaultReturn,
      error: err
    };
  }
}