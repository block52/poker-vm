import { PlayerActionType, ActionDTO, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { parseMicroToBigInt } from "../constants/currency";

type CalculatePotBetAmountParams = {
    currentRound: TexasHoldemRound;
    previousActions: ActionDTO[];
    callAmount: bigint; // in micro-units (10^6)
    pot: bigint; // in micro-units (10^6)
}

/**
 * Calculates the pot bet amount for ante/preflop rounds or uses fallback for other rounds.
 * All amounts are in micro-units (10^6 precision).
 *
 * @param currentRound The current round (TexasHoldemRound)
 * @param previousActions Array of previous actions (ActionDTO[])
 * @param callAmount The call amount as bigint (micro-units)
 * @param pot The current pot as bigint (micro-units)
 * @returns The calculated pot bet amount in micro-units
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
                // Parse amount as bigint micro-units
                const amount: bigint = parseMicroToBigInt(action.amount);
                if (amount > highestBet) highestBet = amount;
            }
        }
    }

    console.log("Highest Bet calculated:", highestBet.toString());
    console.log("Call Amount:", callAmount.toString());
    console.log("Pot:", pot.toString());

    // Pot bet calculation: CALL + HB + POT
    const potBet = callAmount + highestBet + pot;

    return potBet;
}
