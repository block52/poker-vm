import { useGameState } from "./useGameState";
import { PlayerDTO, PlayerStatus, TexasHoldemStateDTO, WinnerDTO } from "@bitcoinbrisbane/block52";
import { formatWeiToDollars } from "../utils/numberUtils";
import { WinnerInfoReturn } from "../types/index";

/**
 * Extract winner information from game state
 * @param gameData The parsed game data
 * @returns Array of winner information or null if no winners
 */
function getWinnerInfo(gameData: TexasHoldemStateDTO) {
    if (!gameData) return null;

    // Check for explicit winners array in the game data
    if (gameData.winners && gameData.winners.length > 0) {
        return gameData.winners.map((winner: WinnerDTO) => {
            // Get the player object for this winner to find their seat
            const player = gameData.players?.find((p: any) => p.address?.toLowerCase() === winner.address?.toLowerCase());

            return {
                seat: player?.seat || 0,
                address: winner.address,
                amount: winner.amount.toString(),
                formattedAmount: formatWeiToDollars(winner.amount.toString()),
                winType: "showdown"
            };
        });
    }

    // Check for "win by fold" scenario - when all players except one have folded
    const totalPlayersAtTable = gameData.players?.filter((p: PlayerDTO) => p).length || 0;

    // Only proceed with win detection if there are at least 2 players
    if (totalPlayersAtTable >= 2) {
        const activePlayers = gameData.players?.filter((p: PlayerDTO) => p && p.status !== PlayerStatus.FOLDED && p.status !== PlayerStatus.ACTIVE) || [];

        // Check if this is a real win-by-fold situation
        const somePlayersHaveFolded = gameData.players?.some((p: PlayerDTO) => p && p.status === PlayerStatus.FOLDED);
        const hasPreviousActions = gameData.previousActions?.length > 0;

        // Only declare a winner if:
        // 1. Only one player remains active AND
        // 2. The hand has started AND
        // 3. Either some players folded OR there were previous actions
        if (activePlayers.length === 1 && (somePlayersHaveFolded || hasPreviousActions)) {
            // Calculate pot amount
            let potAmount = "0";
            if (gameData.pots && Array.isArray(gameData.pots)) {
                potAmount = gameData.pots.reduce((sum: string, pot: string) => {
                    return (BigInt(sum) + BigInt(pot)).toString();
                }, "0");
            }

            const winner = {
                seat: activePlayers[0].seat,
                address: activePlayers[0].address,
                amount: potAmount,
                formattedAmount: formatWeiToDollars(potAmount),
                winType: "fold" // Add this to distinguish win by fold
            };

            return [winner];
        }
    }

    // No winners yet
    return null;
}

/**
 * Custom hook to fetch and provide winner information
 * @param tableId The ID of the table to fetch state for
 * @returns Object containing winner information
 */
export const useWinnerInfo = (tableId?: string): WinnerInfoReturn => {
    // Get game state from centralized hook
    const { gameState, isLoading, error } = useGameState(tableId);

    // Default values in case of error or loading
    const defaultState: WinnerInfoReturn = {
        winnerInfo: null as
            | {
                  seat: number;
                  address: string;
                  amount: string | number;
                  formattedAmount: string;
                  winType?: string;
              }[]
            | null,
        error
    };

    // If still loading or error occurred, return default values
    if (isLoading || error || !gameState) {
        return defaultState;
    }

    try {
        // Process winner information
        const winners = getWinnerInfo(gameState);
        const result: WinnerInfoReturn = {
            winnerInfo: winners,
            error: null
        };

        return result;
    } catch (err) {
        console.error("Error parsing winner information:", err);
        return {
            ...defaultState,
        };
    }
};
