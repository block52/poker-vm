import { PlayerChipDataReturn } from "../types/index";
import { useGameStateContext } from "../context/GameStateContext";
import { ActionDTO, PlayerActionType } from "@bitcoinbrisbane/block52";

/**
 * Custom hook to fetch and provide player chip data for each seat
 *
 * SIMPLIFIED: Uses GameStateContext directly instead of useGameState
 * This prevents creating multiple WebSocket connections for the same table
 *
 * @param tableId The ID of the table (not used - Context manages subscription)
 * @returns Object containing player chip data mapped by seat
 */
export const usePlayerChipData = (tableId?: string): PlayerChipDataReturn => {
    // Get game state directly from Context - no additional WebSocket connections
    const { gameState, isLoading, error } = useGameStateContext();

    // Default values in case of error or loading
    const defaultState: PlayerChipDataReturn = {
        getChipAmount: (seatIndex: number): string => "0",
        isLoading,
        error
    };

    // Early returns for expected states
    if (isLoading || error) {
        return defaultState;
    }

    // Defensive programming: validate gameState structure
    if (!gameState) {
        console.warn("[usePlayerChipData] No game state available");
        return { ...defaultState, error: new Error("No game state available") };
    }

    if (!gameState.players || !Array.isArray(gameState.players)) {
        console.warn("[usePlayerChipData] No players data found in game state");
        return { ...defaultState, error: new Error("No players data found") };
    }

    if (!gameState.previousActions || !Array.isArray(gameState.previousActions)) {
        console.warn("[usePlayerChipData] No previous actions found in game state");
        // This might be normal for a new game, so don't error out
        return {
            getChipAmount: () => "0",
            isLoading: false,
            error: null
        };
    }

    // Define betting actions once
    const bettingActions = [
        PlayerActionType.SMALL_BLIND,
        PlayerActionType.BIG_BLIND, 
        PlayerActionType.BET,
        PlayerActionType.CALL,
        PlayerActionType.RAISE,
        PlayerActionType.ALL_IN
    ];

    // Function to get chip amount for a given seat
    const getChipAmount = (seatIndex: number): string => {
        // Input validation
        if (!Number.isInteger(seatIndex) || seatIndex < 1) {
            console.warn(`[usePlayerChipData] Invalid seat index: ${seatIndex}`);
            return "0";
        }

        // 1. Find the player sitting at this seat
        const playerAtSeat = gameState.players.find(player => player.seat === seatIndex);
        
        // If no player at this seat, return "0" (this is normal)
        if (!playerAtSeat) {
            return "0";
        }

        // Validate player data
        if (!playerAtSeat.address) {
            console.warn(`[usePlayerChipData] Player at seat ${seatIndex} has no address`);
            return "0";
        }

        // 2. Get all previous actions for this player by filtering by playerId (address)
        const playerActions = gameState.previousActions.filter((action: ActionDTO) => {
            // Validate action structure
            if (!action || !action.playerId || !action.action) {
                return false;
            }

            // Only include this player's actions
            if (action.playerId !== playerAtSeat.address) {
                return false;
            }
            
            // 3. Only include betting actions that represent chips on the table
            return bettingActions.includes(action.action as PlayerActionType);
        });

        // 4. Sum up all the amounts from this player's betting actions
        let sumOfBets = BigInt(0);
        
        for (const action of playerActions) {
            try {
                // Only place where we need try-catch - BigInt conversion can fail
                const amount = BigInt(action.amount || "0");
                sumOfBets += amount;
                } catch (err) {
                    console.warn(`[usePlayerChipData] Invalid amount in action: ${action}, ${err}`);
                // Continue with other actions instead of failing completely
            }
        }
        
        return sumOfBets.toString();
    };

    return {
        getChipAmount,
        isLoading: false,
        error: null
    };
};
