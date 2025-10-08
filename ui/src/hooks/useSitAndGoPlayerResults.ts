import { useMemo } from "react";
import { ResultDTO } from "@bitcoinbrisbane/block52";
import { useGameStateContext } from "../context/GameStateContext";
import { formatWeiToSimpleDollars } from "../utils/numberUtils";

// Hook return type for individual player result
export interface PlayerResultData {
    place: number;
    payout: string;
    formattedPayout: string;
    isWinner: boolean;
}

// Hook return type
export interface SitAndGoPlayerResultsReturn {
    // Get result for a specific player address
    getPlayerResult: (playerAddress: string) => PlayerResultData | null;
    // Get result for a specific seat
    getSeatResult: (seatNumber: number) => PlayerResultData | null;
    // All results
    allResults: ResultDTO[];
    // Check if game has ended
    hasResults: boolean;
    // Check if it's a sit and go game
    isSitAndGo: boolean;
}

/**
 * Hook to get Sit & Go tournament results for players
 * Maps tournament results to player seats and provides formatted payout information
 */
export const useSitAndGoPlayerResults = (): SitAndGoPlayerResultsReturn => {
    const { gameState } = useGameStateContext();

    // Check if it's a sit and go game
    const isSitAndGo = useMemo(() => {
        return gameState?.type === "sit-and-go";
    }, [gameState?.type]);

    // Get all results
    const allResults = useMemo(() => {
        return gameState?.results || [];
    }, [gameState?.results]);

    // Check if game has results
    const hasResults = useMemo(() => {
        return allResults.length > 0;
    }, [allResults]);

    // Get result for a specific player address
    const getPlayerResult = useMemo(() => {
        return (playerAddress: string): PlayerResultData | null => {
            if (!playerAddress || !hasResults) return null;

            // Find the result for this player (case-insensitive)
            const result = allResults.find(
                r => r.playerId?.toLowerCase() === playerAddress.toLowerCase()
            );

            if (!result) {
                // Check if player is the winner (not in results but won)
                const winner = gameState?.winners?.find(
                    w => w.address?.toLowerCase() === playerAddress.toLowerCase()
                );

                if (winner) {
                    // Winner gets 1st place
                    return {
                        place: 1,
                        payout: winner.amount || "0",
                        formattedPayout: formatWeiToSimpleDollars(winner.amount || "0"),
                        isWinner: true
                    };
                }
                return null;
            }

            return {
                place: result.place,
                payout: result.payout,
                formattedPayout: formatWeiToSimpleDollars(result.payout),
                isWinner: result.place === 1
            };
        };
    }, [allResults, hasResults, gameState?.winners]);

    // Get result for a specific seat number
    const getSeatResult = useMemo(() => {
        return (seatNumber: number): PlayerResultData | null => {
            if (!seatNumber || !hasResults || !gameState?.players) return null;

            // Find the player at this seat
            const player = gameState.players.find(p => p.seat === seatNumber);
            if (!player?.address) return null;

            // Get the result for this player
            return getPlayerResult(player.address);
        };
    }, [gameState?.players, hasResults, getPlayerResult]);

    return {
        getPlayerResult,
        getSeatResult,
        allResults,
        hasResults,
        isSitAndGo
    };
};