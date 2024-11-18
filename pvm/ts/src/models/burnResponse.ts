import { IJSONModel } from "./interfaces";
import { Transaction } from "../models";
import { BurnResponseDTO } from "@bitcoinbrisbane/block52";

export class BurnResponse implements IJSONModel {
    constructor(readonly amount: bigint, readonly to: string, readonly nonce: Buffer, readonly signature: string, readonly burnTransaction: Transaction) {}

    public toJson(): BurnResponseDTO {
        return {
            mintSignature: {
                amount: this.amount.toString(),
                to: this.to,
                nonce: this.nonce.toString("hex"),
                signature: this.signature
            },
            burnTransaction: this.burnTransaction.toJson()
        };
    }
}
