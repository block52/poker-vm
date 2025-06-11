import { GameOptions, PlayerActionType, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import { OrderedTransaction } from "../engine/types";
import { ITransaction } from "../models/interfaces";

export const toGameOptions = (data: string): GameOptions => {
    throw new Error("Not implemented");
};

export const toOrderedTransaction = (tx: ITransaction): OrderedTransaction => {
    if (!tx.data) {
        throw new Error("Transaction data is undefined");
    }

    // Parse key-value pairs from transaction data (e.g., "actionType=bet&index=11&inGameAmount=50000000000000000")
    const params = new URLSearchParams(tx.data);
    
    const actionType = params.get('actionType');
    const indexStr = params.get('index');
    
    if (!actionType) {
        throw new Error(`Missing actionType in transaction data: ${tx.data}`);
    }
    
    if (!indexStr) {
        throw new Error(`Missing index in transaction data: ${tx.data}`);
    }
    
    const action = actionType.trim() as PlayerActionType | NonPlayerActionType;
    const index = parseInt(indexStr.trim());
    
    if (isNaN(index)) {
        throw new Error(`Invalid index in transaction data: ${indexStr}`);
    }
    
    // Extract other optional parameters
    const seat = params.get('seat');
    const inGameAmount = params.get('inGameAmount');
    const seed = params.get('seed');
    
    // Determine the actual amount to use
    let actionAmount = tx.value;
    let actionData = seat; // Default to seat if provided
    
    // If inGameAmount is specified, use it for poker actions
    if (inGameAmount && !isNaN(Number(inGameAmount))) {
        actionAmount = BigInt(inGameAmount);
        // For poker actions with inGameAmount, we don't need additional data
        if (action === 'bet' || action === 'raise' || action === 'call') {
            actionData = null;
        }
    }
    
    // If seed is specified, use it for new-hand actions
    if (seed && action === NonPlayerActionType.NEW_HAND) {
        actionData = seed;
    }

    return {
        from: tx.from,
        to: tx.to,
        value: actionAmount,
        type: action,
        index: index,
        data: actionData
    };
};
