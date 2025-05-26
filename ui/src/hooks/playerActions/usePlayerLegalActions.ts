import { useGameState } from "../useGameState";
import { PlayerLegalActionsResult } from "./types";
import { LegalActionDTO, PlayerActionType } from "@bitcoinbrisbane/block52";

/**
 * Custom hook to fetch the legal actions for the current player
 * Uses real-time WebSocket data - no polling needed
 * @param tableId The table ID
 * @returns Object containing the player's legal actions and related information
 */
export function usePlayerLegalActions(tableId?: string): PlayerLegalActionsResult {
    // Get the user's address from localStorage
    const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();

    // Get game state from centralized WebSocket hook
    const { gameState, isLoading, error, refresh } = useGameState(tableId);

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
        let currentPlayer = null;
        let isPlayerInGame = false;

        if (userAddress && gameState.players?.length > 0) {
            // Try to find player with exact address match
            currentPlayer = gameState.players?.find((player: any) => player.address?.toLowerCase() === userAddress);

            // If not found, try with case-insensitive comparison
            if (!currentPlayer) {
                currentPlayer = gameState.players?.find((player: any) => player.address?.toLowerCase().includes(userAddress.substring(0, 10).toLowerCase()));
            }

            isPlayerInGame = currentPlayer === undefined || currentPlayer === null;

            // if (currentPlayer) {
            //     isPlayerInGame = true;
            // } else {
            //     isPlayerInGame = false;
            // }
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
        const isPlayerTurn = gameState.nextToAct === currentPlayer.seat;

        // Find the fold action index
        let foldActionIndex = null;
        if (Array.isArray(currentPlayer.legalActions)) {
            const foldAction = currentPlayer.legalActions.find((action: LegalActionDTO) => action.action === PlayerActionType.FOLD);
            if (foldAction) {
                foldActionIndex = foldAction.index;
            }
        }

        // Calculate the common action turn index
        // Get all indices from all legal actions
        let actionTurnIndex = 0;
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
        // TODO: MAKE A STRONG TYPE
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

        return result;
    } catch (err) {
        console.error("⚠️ Error parsing player legal actions:", err);
        return {
            ...defaultReturn,
            error: err
        };
    }
}
