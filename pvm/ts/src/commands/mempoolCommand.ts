import { getMempoolInstance, Mempool } from "../core/mempool";
import { TransactionList } from "../models/transactionList";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class MempoolCommand implements ISignedCommand<TransactionList> {
    private readonly mempool: Mempool;

    constructor(private readonly privateKey: string) {
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<TransactionList>> {
        // Fetch transactions from the mempool
        const transactions = await this.mempool.get();

        return signResult(new TransactionList(transactions), this.privateKey);
    }
}
