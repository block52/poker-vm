import { GameOptions, PlayerActionType, KEYS, NonPlayerActionType } from "@block52/poker-vm-sdk";
import { OrderedTransaction } from "../engine/types";
import { ITransaction } from "../models/interfaces";

export const toGameOptions = (_data: string): GameOptions => {
    throw new Error("Not implemented");
};

export const toKeys = (data: string): Record<string, string> => {
    const params = new URLSearchParams(data);
    const keys: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
        keys[key] = value;
    }
    return keys;
};


// Assume they're game transactions
export const toOrderedTransaction = (tx: ITransaction): OrderedTransaction => {
    if (!tx.data) {
        throw new Error("Transaction data is undefined");
    }

    try {
        // Parse URLSearchParams format
        const params = new URLSearchParams(tx.data);

        const actionType = params.get(KEYS.ACTION_TYPE);
        const indexStr = params.get(KEYS.INDEX);
        const valueStr = params.get(KEYS.VALUE);

        if (!actionType) {
            throw new Error(`Invalid transaction data format: missing ${KEYS.ACTION_TYPE} in ${tx.data}`);
        }

        if (!indexStr) {
            throw new Error(`Invalid transaction data format: missing ${KEYS.INDEX} in ${tx.data}`);
        }

        const action = actionType.trim() as PlayerActionType | NonPlayerActionType;
        const index = parseInt(indexStr.trim());

        if (isNaN(index)) {
            throw new Error(`Invalid index in transaction data: ${indexStr}`);
        }

        const result: OrderedTransaction = {
            from: tx.from,
            to: tx.to,
            value: valueStr ? BigInt(valueStr) : BigInt(0), // Default to 0 if value is not provided
            type: action,
            index: index,
            data: tx.data
        };

        return result;
    } catch (error) {
        throw new Error(`Error parsing transaction data: ${error}. Data: ${tx.data}`);
    }
};
