import { ethers } from "ethers";
import { TexasHoldemRound, PlayerActionType, ActionDTO } from "@bitcoinbrisbane/block52";
import { act } from "@testing-library/react";

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
    previousActions: ActionDTO[];
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
                const previousAction = previousActions[i];
                if (previousAction.action === PlayerActionType.BET || (previousAction.action === PlayerActionType.RAISE && previousAction.amount)) {
                    lastBet = Number(ethers.formatUnits(previousAction.amount, 18));
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
