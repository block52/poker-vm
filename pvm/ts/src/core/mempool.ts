import { Transaction } from "../models/transaction";
import Blocks from "../schema/blocks";
import { getTransactionInstance, TransactionManagement } from "../state/transactionManagement";

export class Mempool {
    // private readonly transactions: Transaction[];
    private readonly txMap = new Map<string, Transaction>();
    private readonly transactionManagement: TransactionManagement;

    constructor(readonly maxSize: number = 100) {
        // this.transactions = [];
        this.transactionManagement = getTransactionInstance();
    }

    public async add(transaction: Transaction): Promise<void> {

        if (this.txMap.has(transaction.hash)) {
            console.log(`Transaction already in mempool: ${transaction.hash}`);
            return;
        }

        const exists = await this.transactionManagement.exists(transaction.hash);
        if (exists) {
            console.log(`Transaction already in blockchain: ${transaction.hash}`);
            return;
        }

        // // Check if the transaction is already in the mempool
        // if (this.transactions.find((tx) => tx.hash === transaction.hash)) {
        //     console.log(`Transaction already in mempool: ${transaction.hash}`);
        //     return;
        // }

        // // Check if the mempool is full
        // if (this.transactions.length >= this.maxSize) {
        //     console.log(`Mempool is full: ${this.transactions.length} / ${this.maxSize}`);
        // }

        if (this.txMap.size >= this.maxSize) {
            console.log(`Mempool is full: ${this.txMap.size} / ${this.maxSize}`);
        }

        let currentBlockIndex = 0;
        const lastBlock = await Blocks.findOne().sort({ index: -1 });

        if (lastBlock) {
            currentBlockIndex = lastBlock.index;
        }

        // Check if the transaction is valid
        if (!transaction.verify()) {
            // throw new Error("Invalid transaction");
        }

        console.log(`Adding transaction to mempool: ${transaction.hash}`);

        // this.transactions.push(transaction);
        this.txMap.set(transaction.hash, transaction);
    }

    public get(): Transaction[] {
        // Order transactions by timestamp
        // return this.transactions.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
        return Array.from(this.txMap.values());
    }

    public clear() {
        // this.transactions = [];
        this.txMap.clear();
    }

}

let instance: Mempool;
export const getMempoolInstance = (): Mempool => {
    if (!instance) {
        instance = new Mempool();
    }
    return instance;
}

