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

    // If still loading or error occurred, return default values
    if (isLoading || error || !gameState) {
        return defaultState;
    }

    try {
        if (!gameState.players || !Array.isArray(gameState.players)) {
            console.warn("No players data found in API response");
            return defaultState;
        }

        // Function to get chip amount for a given seat
        const getChipAmount = (seatIndex: number): string => {
            // 1. Find the player sitting at this seat
            const playerAtSeat = gameState.players.find(player => player.seat === seatIndex);
            console.log(`Player at seat ${seatIndex}:`, playerAtSeat);
            
            // If no player at this seat, return "0"
            if (!playerAtSeat) {
                return "0";
            }
            
            // 2. Get all previous actions for this player by filtering by playerId (address)
            const actions: ActionDTO[] = gameState.previousActions ?? [];
            const playerActions = actions.filter(action => {
                // Only include this player's actions
                if (action.playerId !== playerAtSeat.address) return false;
                
                // 3. Only include betting actions that represent chips on the table
                // Exclude JOIN, LEAVE, DEAL, and other non-betting actions
                const bettingActions = [
                    PlayerActionType.SMALL_BLIND,
                    PlayerActionType.BIG_BLIND, 
                    PlayerActionType.BET,
                    PlayerActionType.CALL,
                    PlayerActionType.RAISE,
                    PlayerActionType.ALL_IN
                ];
                
                return bettingActions.includes(action.action as PlayerActionType);
            });
            
            // 4. Sum up all the amounts from this player's betting actions
            const sumOfBets: bigint = playerActions.reduce((total, action) => {
                const amount = BigInt(action.amount ?? 0);
                return total + amount;
            }, BigInt(0));
            
            console.log(`Seat ${seatIndex} - Player: ${playerAtSeat.address}, Betting Actions:`, playerActions);
            console.log(`Seat ${seatIndex} - Sum of betting amounts: ${sumOfBets.toString()}`);
            
            return sumOfBets.toString();
        };

        return {
            getChipAmount,
            isLoading: false,
            error: null
        };
    } catch (err) {
        console.error("Error parsing player chip data:", err);
        return {
            ...defaultState,
            error: err instanceof Error ? err : new Error("Error parsing player chip data")
        };
    }
};
