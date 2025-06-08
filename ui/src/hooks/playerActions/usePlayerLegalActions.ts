import { useGameStateContext } from "../../context/GameStateContext";
import { PlayerLegalActionsResult } from "./types";
import { LegalActionDTO, PlayerActionType, PlayerDTO } from "@bitcoinbrisbane/block52";
import { useRef } from "react";

// 🔍 DEBUG: Enhanced logging utility for easy data export (same as GameStateContext)
const debugLog = (eventType: string, data: any) => {
  console.log(`🔄 [${eventType}]`, data);
  
  // Access the global debug logs array if it exists
  if (typeof window !== "undefined" && (window as any).debugLogs) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      data
    };
    (window as any).debugLogs.push(logEntry);
  }
};

/**
 * Custom hook to fetch the legal actions for the current player
 * 
 * NOTE: Table identification and player legal actions are handled through GameStateContext subscription.
 * Components call subscribeToTable(tableId) which creates a WebSocket connection with both tableAddress 
 * and playerId (player address) parameters. This hook reads the real-time legal actions from that context.
 * 
 * @returns Object containing the player's legal actions and related information
 */
export function usePlayerLegalActions(): PlayerLegalActionsResult {
    // Get the user's address from localStorage
    const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();

    // Get game state directly from Context - table ID managed by subscription
    const { gameState, isLoading, error } = useGameStateContext();
    
    // 🔍 DEBUG: Log every time this hook executes to track re-renders
    debugLog("usePlayerLegalActions EXECUTION", {
        timestamp: new Date().toISOString(),
        hookExecuted: true,
        gameStateExists: !!gameState,
        nextToAct: gameState?.nextToAct,
        playerCount: gameState?.players?.length,
        round: gameState?.round,
        isLoading,
        hasError: !!error,
        userAddress: userAddress?.substring(0, 8) + "...",
        source: "usePlayerLegalActions hook execution"
    });
    
    // Add ref to track last logged state to prevent spam
    const lastLoggedStateRef = useRef<string>("");

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
        foldActionIndex: null,
        actionTurnIndex: 0,
        isPlayerInGame: false
    };

    // Handle loading and error states
    if (isLoading) {
        return defaultReturn;
    }

    if (error) {
        return defaultReturn;
    }

    if (!gameState) {
        return defaultReturn;
    }

    try {

        // Try to find the current player in the table data
        let currentPlayer: PlayerDTO | null = null;
        let isPlayerInGame = false;

        if (userAddress && gameState.players?.length > 0) {
            // Try to find player with exact address match
            currentPlayer = gameState.players?.find((player: PlayerDTO) => player.address?.toLowerCase() === userAddress) ?? null;

            // If not found, try with case-insensitive comparison
            if (!currentPlayer) {
                currentPlayer = gameState.players?.find((player: PlayerDTO) => player.address?.toLowerCase().includes(userAddress.substring(0, 10).toLowerCase())) ?? null;
            }

            isPlayerInGame = !!currentPlayer;
           
        }

        // If no player found with the user's address, use the first player with legal actions
        // This is useful for debugging and showing actions when the address doesn't match
        if (!currentPlayer && gameState.players?.length > 0) {
            // Find the first player that has legal actions
            for (const player of gameState.players) {
                if (player.legalActions && player.legalActions.length > 0) {
                    currentPlayer = player;
                    break;
                }
            }

            // If still no player with actions, just use the first player
            if (!currentPlayer) {
                currentPlayer = gameState.players[0];
            }
        }

        // If there's still no player found, return default
        if (!currentPlayer) {
            return defaultReturn;
        }

        // Check if it's the player's turn
        const isPlayerTurn: boolean = gameState.nextToAct === currentPlayer.seat;

        // Find the fold action index
        let foldActionIndex: number | null = null;
        if (Array.isArray(currentPlayer.legalActions)) {
            const foldAction = currentPlayer.legalActions.find((action: LegalActionDTO) => action.action === PlayerActionType.FOLD);
            if (foldAction) {
                foldActionIndex = foldAction.index;
            }
        }

        // Calculate the common action turn index
        // Get all indices from all legal actions
        let actionTurnIndex: number = 0;
        if (Array.isArray(currentPlayer.legalActions) && currentPlayer.legalActions.length > 0) {
            // Get the first index - all actions should have the same index
            const firstActionIndex = currentPlayer.legalActions[0].index;

            // Verify that all actions have the same index (for debugging)
            const allSameIndex = currentPlayer.legalActions.every((action: LegalActionDTO) => action.index === firstActionIndex);

            if (!allSameIndex) {
                console.warn("⚠️ WARNING: Not all legal actions have the same index!");
                console.warn(
                    "⚠️ Action indices:",
                    currentPlayer.legalActions.map((a: LegalActionDTO) => `${a.action}: ${a.index}`)
                );
            }

            actionTurnIndex = firstActionIndex;
        }

        // Extract and return all the relevant information
        const result: PlayerLegalActionsResult = {
            legalActions: Array.isArray(currentPlayer.legalActions) ? currentPlayer.legalActions : [],
            isSmallBlindPosition: currentPlayer.isSmallBlind || gameState.smallBlindPosition === currentPlayer.seat,
            isBigBlindPosition: currentPlayer.isBigBlind || gameState.bigBlindPosition === currentPlayer.seat,
            isDealerPosition: currentPlayer.isDealer || gameState.dealer === currentPlayer.seat,
            isPlayerTurn,
            playerStatus: currentPlayer.status || null,
            playerSeat: currentPlayer.seat || null,
            isLoading: false,
            error: null,
            foldActionIndex,
            actionTurnIndex, // Add the common action turn index
            isPlayerInGame // Add the flag indicating if the player is in the game
        };

        // 🔍 DEBUG: Log legal actions calculation, especially for CHECK
        const hasCheckAction = result.legalActions.some(action => action.action === PlayerActionType.CHECK);
        if (hasCheckAction || isPlayerTurn) {
            const currentState = JSON.stringify({
                playerSeat: currentPlayer.seat,
                isPlayerTurn,
                gameRound: gameState.round,
                nextToAct: gameState.nextToAct,
                legalActions: result.legalActions.map(action => action.action), // Just action types for comparison
                hasCheckAction,
                playerStatus: currentPlayer.status
            });

            // Only log if the state actually changed
            if (currentState !== lastLoggedStateRef.current) {
                debugLog("LEGAL ACTIONS CALCULATED", {
                    timestamp: new Date().toISOString(),
                    playerSeat: currentPlayer.seat,
                    isPlayerTurn,
                    gameRound: gameState.round,
                    nextToAct: gameState.nextToAct,
                    legalActions: result.legalActions.map(action => ({
                        action: action.action,
                        min: action.min,
                        max: action.max,
                        index: action.index
                    })),
                    hasCheckAction,
                    playerStatus: currentPlayer.status,
                    source: "usePlayerLegalActions"
                });
                lastLoggedStateRef.current = currentState;
            }
        }
        
        // 🔍 DEBUG: Log final result with raw gameState comparison
        debugLog("FINAL LEGAL ACTIONS RESULT", {
            timestamp: new Date().toISOString(),
            result: {
                playerSeat: result.playerSeat,
                isPlayerTurn: result.isPlayerTurn,
                actionTurnIndex: result.actionTurnIndex,
                legalActionCount: result.legalActions.length
            },
            rawGameStateUsed: {
                nextToAct: gameState?.nextToAct,
                round: gameState?.round,
                playerCount: gameState?.players?.length,
                tableAddress: gameState?.address
            },
            currentPlayerData: {
                seat: currentPlayer?.seat,
                address: currentPlayer?.address?.substring(0, 8) + "...",
                status: currentPlayer?.status,
                legalActionCount: currentPlayer?.legalActions?.length || 0
            },
            source: "usePlayerLegalActions final result"
        });

        return result;
    } catch (err) {
        console.error("⚠️ Error parsing player legal actions:", err);
        return {
            ...defaultReturn,
            error: err instanceof Error ? err : new Error("Unknown error occurred")
        };
    }
}
