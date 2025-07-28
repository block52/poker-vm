import { ActionDTO, LegalActionDTO, NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { ethers } from "ethers";

// Add function to format address
export const formatAddress = (address: string | undefined) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Modify formatBalance to add logging
export const formatBalance = (rawBalance: string | number) => {
    const value = Number(rawBalance) / 1e18;
    const formatted = value.toFixed(2);
    return formatted;
};

export const hasAction = (legalActions: LegalActionDTO[], action: PlayerActionType | NonPlayerActionType): boolean => {
    return legalActions.some(legalAction => legalAction.action === action);
};

// Find the specific actions
export const getActionByType = (legalActions: LegalActionDTO[], actionType: PlayerActionType | NonPlayerActionType): LegalActionDTO | undefined => {
    return legalActions.find(action => action.action === actionType || action.action?.toString() === actionType?.toString());
};

export const getRaiseToAmount = (actions: ActionDTO[], currentRound: TexasHoldemRound, userAddress: string): number => {
    // Get players previous actions
    const previousActions = actions.filter(action => action.playerId?.toLowerCase() === userAddress.toLowerCase());

    if (!previousActions || previousActions.length === 0) {
        // If no previous actions, return 0
        return 0;
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

    return 0;
};