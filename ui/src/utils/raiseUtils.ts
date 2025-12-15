import { ActionDTO, PlayerActionType, TexasHoldemRound } from "@block52/poker-vm-sdk";
import { ethers } from "ethers";

export const getRaiseToAmount = (raiseAmount: number, actions: ActionDTO[], currentRound: TexasHoldemRound, userAddress: string): number => {
    // If no actions, return raiseAmount
    if (!actions || actions.length === 0) {
        return raiseAmount;
    }

    // Get players previous actions
    const previousActions = actions.filter(action => action.playerId?.toLowerCase() === userAddress.toLowerCase());

    if (!previousActions || previousActions.length === 0) {
        // If no previous actions, return raiseAmount
        return raiseAmount;
    }

    const currentRoundActions: ActionDTO[] = previousActions.filter(action => action.round === currentRound);

    // If the current round is PREFLOP, include ante actions
    if (currentRound === TexasHoldemRound.PREFLOP) {
        const anteAction = previousActions.find(action => action.action === PlayerActionType.SMALL_BLIND || action.action === PlayerActionType.BIG_BLIND);
        if (anteAction) {
            // Add ante action to the current round actions
            currentRoundActions.push(anteAction);
        }
    }

    // Filter by bet and raise actions only
    const previousBetsAndRaises: ActionDTO[] = currentRoundActions.filter(
        action =>
            action.action === PlayerActionType.BET ||
            action.action === PlayerActionType.RAISE ||
            action.action === PlayerActionType.CALL ||
            action.action === PlayerActionType.SMALL_BLIND ||
            action.action === PlayerActionType.BIG_BLIND
    );

    // Sum the raise amount and previous bets/raises
    const totalPreviousBetsAndRaises: number = previousBetsAndRaises.reduce((sum, action) => {
        const amount = action.amount ? Number(ethers.formatUnits(action.amount, 18)) : 0;
        return sum + amount;
    }, 0);

    // Calculate the raise amount based on previous bets/raises
    // return raiseAmount > 0 ? raiseAmount + totalPreviousBetsAndRaises : minRaise;

    return raiseAmount + totalPreviousBetsAndRaises;
};