
import { Transaction } from "../models";
import { ICommand } from "./interfaces";

export class TransferCommand implements ICommand<Transaction> {
    constructor(readonly from: string, readonly to: string, readonly amount: bigint, readonly privateKey: string) {
        this.from = from;
        this.to = to;
        this.amount = amount;
    }

    public async execute(): Promise<Transaction> {
        const transferTx: Transaction = Transaction.create(this.to, this.from, this.amount, this.privateKey);
        return transferTx;
    }
}
