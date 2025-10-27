import { ethers } from "ethers";
import { PlayerActionType, ActionDTO } from "@bitcoinbrisbane/block52";
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
    previousActions,
    formattedTotalPot,
    hasBetAction,
    minBet,
    minRaise,
    totalPot
}: {
    previousActions: ActionDTO[];
    formattedTotalPot: string;
    hasBetAction: boolean;
    minBet: number;
    minRaise: number;
    totalPot: number;
}): number {
    // Find the highest bet (HB) in the round
    let highestBet = 0;
    if (Array.isArray(previousActions)) {
        for (let i = 0; i < previousActions.length; i++) {
            const action = previousActions[i];
            if ((action.action === PlayerActionType.BET || action.action === PlayerActionType.RAISE) && action.amount) {
                const amt = Number(ethers.formatUnits(action.amount, 18));
                if (amt > highestBet) highestBet = amt;
            }
        }
    }

    // The amount the player must call to match the highest bet (CALL)
    // For this function, we assume minBet is the call amount for the player to act
    // (If you have a more accurate call amount, pass it in instead of minBet)
    const callAmount = minBet;

    // The current pot
    const pot = Number(formattedTotalPot) || totalPot || 0;

    // Pot bet calculation: CALL + HB + POT
    let potBet = callAmount + highestBet + pot;

    // Fallback to minBet/minRaise if needed
    if (isNaN(potBet) || potBet <= 0) {
        potBet = hasBetAction ? minBet : minRaise;
    }
    return potBet;
}
