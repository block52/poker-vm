import { GameOptions, PlayerActionType } from "@bitcoinbrisbane/block52";
import { OrderedTransaction } from "../engine/types";
import { ITransaction } from "../models/interfaces";

export const toGameOptions = (data: string): GameOptions => {
    throw new Error("Not implemented");
}

export const toOrderedTransaction = (tx: ITransaction): OrderedTransaction => {
    if (!tx.data) {
        throw new Error("Transaction data is undefined");
    }

    // // Get the parts out of data using a REGEX
    // const regex = /(\w+),(\d+),?(\w+)?/;
    // const match = tx.data.match(regex);
    // if (!match) {
    //     throw new Error(`Invalid transaction data format: ${tx.data}`);
    // }

    const params = tx.data.split(",");
    const action = params[0].trim() as PlayerActionType;
    const index = parseInt(params[1].trim());
    // const action = match[1].trim() as PlayerActionType;

    // // Get index from the regex match
    // const index = parseInt(match[2].trim());
    // if (isNaN(index)) {
    //     throw new Error(`Invalid index in transaction data: ${match[2]}`);
    // }

    return {
        from: tx.from,
        to: tx.to,
        value: tx.value,
        type: action,
        index: index,
        data: params[2] ? params[2].trim() : null
       // data: match[3] ? match[3].trim() : null
    };
}