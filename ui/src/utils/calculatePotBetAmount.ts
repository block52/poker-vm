import { ethers } from "ethers";
import { PlayerActionType, ActionDTO, TexasHoldemRound } from "@bitcoinbrisbane/block52";

type CalculatePotBetAmountParams = {
    currentRound: TexasHoldemRound;
    previousActions: ActionDTO[];
    callAmount: bigint;
    pot: bigint;
}

/**
 * Calculates the pot bet amount for ante/preflop rounds or uses fallback for other rounds.
 * @param currentRound The current round (TexasHoldemRound)
 * @param previousActions Array of previous actions (ActionDTO[])
 * @param pot The current pot as a bigint
 * @returns The calculated pot bet amount
 */
export function calculatePotBetAmount(params: CalculatePotBetAmountParams): bigint {
    const { currentRound, previousActions, callAmount, pot } = params;

    // Find the highest bet (HB) in the round
    const roundActions = previousActions.filter(action => action.round === currentRound);
    
    let highestBet: bigint = 0n;
    if (Array.isArray(roundActions)) {
        for (let i = 0; i < roundActions.length; i++) {
            const action = roundActions[i];
            if ((action.action === PlayerActionType.BET || action.action === PlayerActionType.RAISE) && action.amount) {
                const amount: bigint = BigInt(ethers.formatUnits(action.amount, 18));
                if (amount > highestBet) highestBet = amount;
            }
        }
    }

    console.log("Highest Bet calculated:", highestBet);
    console.log("Call Amount:", callAmount);
    console.log("Pot:", pot);

    // Pot bet calculation: CALL + HB + POT
    const potBet = callAmount + highestBet + pot;

    return potBet;
}
