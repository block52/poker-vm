import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { PlayerActionType, NonPlayerActionType } from "@bitcoinbrisbane/block52";


// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => {
    console.log("API Response for player legal actions:", res.data);
    return res.data;
  });

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
 * Extracts game data from API response, handling different response structures
 */
function extractGameData(data: any): any {
  if (!data) return null;
  
  // Check for response.data.data structure
  if (data.data?.players) {
    return data.data;
  }
  
  // Check for response.data structure
  if (data.players) {
    return data;
  }
  
  // Check for response.result.data structure
  if (data.result?.data?.players) {
    return data.result.data;
  }
  
  console.log("⚠️ Unknown API response structure:", data);
  return null;
}

/**
 * Custom hook to fetch the legal actions for the current player
 * @param tableId The table ID
 * @returns Object containing the player's legal actions and related information
 */
export function usePlayerLegalActions(tableId?: string): PlayerLegalActionsResult {
  // Get the user's address from localStorage
  const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();
  
  console.log("⚠️ usePlayerLegalActions called with tableId:", tableId);
  console.log("⚠️ Current user address:", userAddress);
  
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
  if (isLoading) {
    console.log("⚠️ Still loading game state data...");
    return defaultReturn;
  }
  
  if (error) {
    console.error("⚠️ Error loading game state:", error);
    return defaultReturn;
  }
  
  if (!data) {
    console.log("⚠️ No data received from API");
    return defaultReturn;
  }
  
  console.log("⚠️ Raw API response:", data);
  
  // Extract the game data from the response
  const gameData = extractGameData(data);
  if (!gameData) {
    console.log("⚠️ No game data found in API response");
    return defaultReturn;
  }

  try {
    console.log("⚠️ FULL GAME DATA:", JSON.stringify(gameData, null, 2));
    
    // Try to find the current player in the table data
    let currentPlayer = null;
    
    if (userAddress && gameData.players?.length > 0) {
      // Log all player addresses for debugging
      console.log("⚠️ Players in game:", gameData.players.map((p: any) => 
        `Seat ${p.seat}: ${p.address?.toLowerCase()}`
      ));
      
      // Try to find player with exact address match
      currentPlayer = gameData.players?.find(
        (player: any) => player.address?.toLowerCase() === userAddress
      );
      
      // If not found, try with case-insensitive comparison
      if (!currentPlayer) {
        currentPlayer = gameData.players?.find(
          (player: any) => player.address?.toLowerCase().includes(userAddress.substring(0, 10).toLowerCase())
        );
      }
      
      if (currentPlayer) {
        console.log("⚠️ Found matching player for address:", userAddress);
      } else {
        console.log("⚠️ No matching player found for address:", userAddress);
      }
    }

    // If no player found with the user's address, use the first player with legal actions
    // This is useful for debugging and showing actions when the address doesn't match
    if (!currentPlayer && gameData.players?.length > 0) {
      console.log("⚠️ No exact match found for user address, using first player with actions");
      
      // Find the first player that has legal actions
      for (const player of gameData.players) {
        console.log(`⚠️ Player in seat ${player.seat} has legal actions:`, player.legalActions);
        if (player.legalActions && player.legalActions.length > 0) {
          currentPlayer = player;
          console.log("⚠️ Using player with legal actions:", player);
          break;
        }
      }
      
      // If still no player with actions, just use the first player
      if (!currentPlayer) {
        currentPlayer = gameData.players[0];
        console.log("⚠️ No player with legal actions found, using first player:", currentPlayer);
      }
    }

    // If there's still no player found, return default
    if (!currentPlayer) {
      console.log("⚠️ No player found in game data");
      return defaultReturn;
    }

    console.log("⚠️ USING PLAYER:", JSON.stringify(currentPlayer, null, 2));
    console.log("⚠️ Player legal actions:", currentPlayer.legalActions);
    
    // Check if it's the player's turn
    const isPlayerTurn = gameData.nextToAct === currentPlayer.seat;
    console.log("⚠️ Next to act:", gameData.nextToAct, "Player seat:", currentPlayer.seat, "Is player turn:", isPlayerTurn);
    
    // Extract and return all the relevant information
    const result = {
      legalActions: Array.isArray(currentPlayer.legalActions) ? currentPlayer.legalActions : [],
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
    
    console.log("⚠️ FINAL RESULT:", JSON.stringify(result, null, 2));
    return result;
  } catch (err) {
    console.error("⚠️ Error parsing player legal actions:", err);
    return {
      ...defaultReturn,
      error: err
    };
  }
}