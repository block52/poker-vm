
import { getMempoolInstance } from "../core/mempool";
import { Transaction } from "../models";
import { signResult } from "./abstractSignedCommand";
import { ICommand, ISignedResponse } from "./interfaces";

export class TransferCommand implements ICommand<ISignedResponse<Transaction>> {
    constructor(private from: string, private to: string, private amount: bigint, private data: string | null, private readonly privateKey: string) {}

    public async execute(): Promise<ISignedResponse<Transaction>> {
        if (this.data) {
            console.log(`Data: ${this.data}`);
        }
        const transferTx: Transaction = Transaction.create(this.to, this.from, this.amount, this.privateKey);
        const mempool = getMempoolInstance();
        await mempool.add(transferTx);
        return signResult(transferTx, this.privateKey);
    }
}
