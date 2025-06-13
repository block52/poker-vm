import { GameOptions, PlayerActionType } from "@bitcoinbrisbane/block52";
import { OrderedTransaction } from "../engine/types";
import { ITransaction } from "../models/interfaces";

export const toGameOptions = (data: string): GameOptions => {
    throw new Error("Not implemented");
};

/**
 * Extracts the data field from URLSearchParams formatted string
 * This ensures we have a single place that knows about URLSearchParams format
 */
export const extractDataFromParams = (paramsString: string): string | undefined => {
    if (!paramsString) {
        return undefined;
    }

    try {
        // Parse URLSearchParams format
        const params = new URLSearchParams(paramsString);
        let data = params.get("data");
        
        if (data === "undefined" || data === null) {
            return undefined;
        }
        
        return data;
    } catch (error) {
        // Fallback: assume the string is the data itself (backward compatibility)
        return paramsString === "undefined" ? undefined : paramsString;
    }
};

export const toOrderedTransaction = (tx: ITransaction): OrderedTransaction => {
    if (!tx.data) {
        throw new Error("Transaction data is undefined");
    }

    try {
        // Parse URLSearchParams format
        const params = new URLSearchParams(tx.data);
        
        const actionType = params.get("actionType");
        const indexStr = params.get("index");
        
        if (!actionType || !indexStr) {
            throw new Error(`Invalid transaction data format: missing actionType or index in ${tx.data}`);
        }

        const action = actionType.trim() as PlayerActionType;
        const index = parseInt(indexStr.trim());
        
        if (isNaN(index)) {
            throw new Error(`Invalid index in transaction data: ${indexStr}`);
        }

        // Get additional data if present
        let data = params.get("data");
        if (data === "undefined" || data === null) {
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
