
import { getMempoolInstance } from "../core/mempool";
import { Transaction } from "../models";
import { signResult } from "./abstractSignedCommand";
import { ICommand, ISignedResponse } from "./interfaces";

export class TransferCommand implements ICommand<ISignedResponse<Transaction>> {
    constructor(private from: string, private to: string, private amount: bigint, private readonly privateKey: string) {}

    public async execute(): Promise<ISignedResponse<Transaction>> {
        const transferTx: Transaction = Transaction.create(this.to, this.from, this.amount, this.privateKey);
        const mempool = getMempoolInstance();
        mempool.add(transferTx);
        return signResult(transferTx, this.privateKey);
    }
}
