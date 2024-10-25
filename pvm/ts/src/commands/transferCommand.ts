
import { getMempoolInstance } from "../core/mempool";
import { Transaction } from "../models";
import { AbstractCommand } from "./abstractSignedCommand";
import { ICommand } from "./interfaces";

export class TransferCommand extends AbstractCommand<Transaction> {
    constructor(readonly from: string, readonly to: string, readonly amount: bigint, readonly privateKey: string) {
        super(privateKey);
        this.from = from;
        this.to = to;
        this.amount = amount;
    }

    public async executeCommand(): Promise<Transaction> {
        const transferTx: Transaction = Transaction.create(this.to, this.from, this.amount, this.privateKey);
        const mempool = getMempoolInstance();
        mempool.add(transferTx);
        return transferTx;
    }
}
