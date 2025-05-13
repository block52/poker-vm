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

    const params = tx.data.split(",");
    const action = params[0].trim() as PlayerActionType;
    const index = parseInt(params[1].trim());

    return {
        from: tx.from,
        to: tx.to,
        value: tx.value,
        type: action,
        index: index,
        data: params[2] ? params[2].trim() : undefined
    };
}