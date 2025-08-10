import { GameOptions, PlayerActionType, KEYS, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import { OrderedTransaction } from "../engine/types";
import { ITransaction } from "../models/interfaces";

export const toGameOptions = (data: string): GameOptions => {
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
        
        if (!actionType || !indexStr) {
            throw new Error(`Invalid transaction data format: missing ${KEYS.ACTION_TYPE} or ${KEYS.INDEX} in ${tx.data}`);
        }

        const action = actionType.trim() as PlayerActionType | NonPlayerActionType;
        const index = parseInt(indexStr.trim());
        
        if (isNaN(index)) {
            throw new Error(`Invalid index in transaction data: ${indexStr}`);
        }

        // Hack for now until we implement 1057
        let value = tx.value;
        if (action === NonPlayerActionType.JOIN ) {
            const dataParams = new URLSearchParams(tx.data);
            const valueStr = dataParams.get(KEYS.VALUE);
            if (valueStr) {
                value = BigInt(valueStr);
            }
        }

        return {
            from: tx.from,
            to: tx.to,
            value: value,
            type: action,
            index: index,
            data: tx.data
        };
    } catch (error) {
        // Fallback to old comma-separated format for backward compatibility
        console.warn(`Failed to parse URLSearchParams format, falling back to comma-separated: ${error}`);
        
        const params = tx.data.split(",");
        const action = params[0].trim() as PlayerActionType;

        if (params.length < 2) {
            return {
                from: tx.from,
                to: tx.to,
                value: tx.value,
                type: action,
                index: 0
            };
        }

        const index = parseInt(params[1].trim());

        let data = params[2] ? params[2].trim() : null;
        if (data == "undefined") {
            data = null;
        }

        return {
            from: tx.from,
            to: tx.to,
            value: tx.value,
            type: action,
            index: index,
            data
        };
    }
};
