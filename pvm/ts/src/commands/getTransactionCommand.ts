import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models";
import { getTransactionInstance, TransactionManagement } from "../state/transactionManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class GetTransactionCommand implements ISignedCommand<Transaction> {
    private readonly transactionManagement: TransactionManagement;
    private readonly mempool: Mempool;
    private readonly hash: string;

    constructor(hash: string, private readonly privateKey: string) {
        this.transactionManagement = getTransactionInstance();
        this.mempool = getMempoolInstance();
        this.hash = hash;
    }

    public async execute(): Promise<ISignedResponse<Transaction>> {
        const mempoolTransaction = await this.mempool.getTransaction(this.hash);

        if (mempoolTransaction) {
            return signResult(mempoolTransaction, this.privateKey);
        }

        const transaction = await this.transactionManagement.getTransaction(this.hash);
        if (transaction) {
            return signResult(transaction, this.privateKey);    
        }

        throw new Error("Transaction not found");
    }
}
