import { useGameState } from "../useGameState";
import { PlayerStatus } from "@bitcoinbrisbane/block52";
import { useState } from "react";
import useSWR from "swr";

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
  playerStatus: PlayerStatus | null;
  playerSeat: number | null;
  isLoading: boolean;
  error: any;
  refresh: () => void;
  foldActionIndex: number | null;
  actionTurnIndex: number;
  isPlayerInGame: boolean;
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
  
  // State for frequent refreshes
  const [lastRefresh, setLastRefresh] = useState(0);
  
  // Get game state from centralized hook
  const { gameState, isLoading, error, refresh } = useGameState(tableId);
  
  // Custom more frequent refresh for this critical hook
  useSWR(
    tableId ? `legal-actions-${tableId}` : null,
    async () => {
      const now = Date.now();
      // Refresh if more than 5 seconds have elapsed
      if (now - lastRefresh >= 5000) {
        await refresh();
        setLastRefresh(now);
      }
      return null;
    },
    { refreshInterval: 5000, revalidateOnFocus: true }
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
    refresh,
    foldActionIndex: null,
    actionTurnIndex: 0,
    isPlayerInGame: false
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
  
  if (!gameState) {
    console.log("⚠️ No data received from API");
    return defaultReturn;
  }

  try {
    console.log("⚠️ FULL GAME DATA:", JSON.stringify(gameState, null, 2));
    
    // Try to find the current player in the table data
    let currentPlayer = null;
    let isPlayerInGame = false;
    
    if (userAddress && gameState.players?.length > 0) {
      // Log all player addresses for debugging
      console.log("⚠️ Players in game:", gameState.players.map((p: any) => 
        `Seat ${p.seat}: ${p.address?.toLowerCase()}`
      ));
      
      // Try to find player with exact address match
      currentPlayer = gameState.players?.find(
        (player: any) => player.address?.toLowerCase() === userAddress
      );
      
      // If not found, try with case-insensitive comparison
      if (!currentPlayer) {
        currentPlayer = gameState.players?.find(
          (player: any) => player.address?.toLowerCase().includes(userAddress.substring(0, 10).toLowerCase())
        );
      }
      
      if (currentPlayer) {
        console.log("⚠️ Found matching player for address:", userAddress);
        isPlayerInGame = true;
      } else {
        console.log("⚠️ No matching player found for address:", userAddress);
        isPlayerInGame = false;
      }
    }

    // If no player found with the user's address, use the first player with legal actions
    // This is useful for debugging and showing actions when the address doesn't match
    if (!currentPlayer && gameState.players?.length > 0) {
      console.log("⚠️ No exact match found for user address, using first player with actions");
      
      // Find the first player that has legal actions
      for (const player of gameState.players) {
        console.log(`⚠️ Player in seat ${player.seat} has legal actions:`, player.legalActions);
        if (player.legalActions && player.legalActions.length > 0) {
          currentPlayer = player;
          console.log("⚠️ Using player with legal actions:", player);
          break;
        }
      }
      
      // If still no player with actions, just use the first player
      if (!currentPlayer) {
        currentPlayer = gameState.players[0];
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
    const isPlayerTurn = gameState.nextToAct === currentPlayer.seat;
    console.log("⚠️ Next to act:", gameState.nextToAct, "Player seat:", currentPlayer.seat, "Is player turn:", isPlayerTurn);
    
    // Find the fold action index
    let foldActionIndex = null;
    if (Array.isArray(currentPlayer.legalActions)) {
      const foldAction = currentPlayer.legalActions.find((action: LegalAction) => action.action === "fold");
      if (foldAction) {
        foldActionIndex = foldAction.index;
        console.log("⚠️ Found fold action with index:", foldActionIndex);
      }
    }
    
    // Calculate the common action turn index
    // Get all indices from all legal actions
    let actionTurnIndex = 0;
    if (Array.isArray(currentPlayer.legalActions) && currentPlayer.legalActions.length > 0) {
      // Get the first index - all actions should have the same index
      const firstActionIndex = currentPlayer.legalActions[0].index;
      
      // Verify that all actions have the same index (for debugging)
      const allSameIndex = currentPlayer.legalActions.every((action: LegalAction) => 
        action.index === firstActionIndex
      );
      
      if (!allSameIndex) {
        console.warn("⚠️ WARNING: Not all legal actions have the same index!");
        console.warn("⚠️ Action indices:", currentPlayer.legalActions.map((a: LegalAction) => `${a.action}: ${a.index}`));
      }
      
      actionTurnIndex = firstActionIndex;
      console.log("⚠️ Using common action turn index:", actionTurnIndex);
    }
    
    // Extract and return all the relevant information
    const result = {
      legalActions: Array.isArray(currentPlayer.legalActions) ? currentPlayer.legalActions : [],
      isSmallBlindPosition: currentPlayer.isSmallBlind || gameState.smallBlindPosition === currentPlayer.seat,
      isBigBlindPosition: currentPlayer.isBigBlind || gameState.bigBlindPosition === currentPlayer.seat,
      isDealerPosition: currentPlayer.isDealer || gameState.dealer === currentPlayer.seat,
      isPlayerTurn,
      playerStatus: currentPlayer.status || null,
      playerSeat: currentPlayer.seat || null,
      isLoading: false,
      error: null,
      refresh,
      foldActionIndex,
      actionTurnIndex, // Add the common action turn index
      isPlayerInGame // Add the flag indicating if the player is in the game
    };
    
    console.log("⚠️ FINAL RESULT:", JSON.stringify(result, null, 2));
    console.log("[usePlayerLegalActions] Returns:", {
      numLegalActions: result.legalActions.length,
      isSmallBlindPosition: result.isSmallBlindPosition,
      isBigBlindPosition: result.isBigBlindPosition, 
      isDealerPosition: result.isDealerPosition,
      isPlayerTurn: result.isPlayerTurn,
      playerStatus: result.playerStatus,
      playerSeat: result.playerSeat,
      foldActionIndex: result.foldActionIndex,
      actionTurnIndex: result.actionTurnIndex,
      isPlayerInGame: result.isPlayerInGame,
      isLoading: result.isLoading,
      hasError: !!result.error
    });
    
    return result;
  } catch (err) {
    console.error("⚠️ Error parsing player legal actions:", err);
    return {
      ...defaultReturn,
      error: err
    };
  }
}