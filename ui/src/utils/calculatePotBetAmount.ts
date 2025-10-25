import { ethers } from "ethers";
import { TexasHoldemRound, PlayerActionType } from "@bitcoinbrisbane/block52";

/**
 * Calculates the pot bet amount for ante/preflop rounds or uses fallback for other rounds.
 * @param currentRound The current round (TexasHoldemRound)
 * @param previousActions Array of previous actions (ActionDTO[])
 * @param formattedTotalPot The current pot as a string (formatted)
 * @param hasBetAction Boolean if bet action is available
 * @param minBet Minimum bet amount
 * @param minRaise Minimum raise amount
 * @param totalPot The total pot as a number
 * @returns The calculated pot bet amount
 */
export function calculatePotBetAmount({
    currentRound,
    previousActions,
    formattedTotalPot,
    hasBetAction,
    minBet,
    minRaise,
    totalPot
}: {
    currentRound: TexasHoldemRound;
    previousActions: any[];
    formattedTotalPot: string;
    hasBetAction: boolean;
    minBet: number;
    minRaise: number;
    totalPot: number;
}): number {
    if (
        currentRound === TexasHoldemRound.ANTE ||
        currentRound === TexasHoldemRound.PREFLOP
    ) {
        // Find last bet (HR) from previousActions
        let lastBet = 0;
        if (Array.isArray(previousActions)) {
            for (let i = previousActions.length - 1; i >= 0; i--) {
                const act = previousActions[i];
                if (act.action === PlayerActionType.BET && act.amount) {
                    lastBet = Number(ethers.formatUnits(act.amount, 18));
                    break;
                }
            }
        }
        // Calculate DM (dead money)
        const pot = Number(formattedTotalPot) || 0;
        const DM = pot - lastBet;
        let newAmt = DM + 3 * lastBet;
        // Fallback to minBet/minRaise if needed
        if (isNaN(newAmt) || newAmt <= 0) {
            newAmt = hasBetAction ? minBet : minRaise;
        }
        return newAmt;
    } else {
        return Math.max(totalPot, hasBetAction ? minBet : minRaise);
    }
}
