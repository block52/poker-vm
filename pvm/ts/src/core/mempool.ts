import { IJSONModel } from "../models/interfaces";
import { Transaction } from "../models/transaction";
import { TransactionDTO } from "../types/chain";

export class Mempool {
    private transactions: Transaction[];

    constructor(readonly maxSize: number = 100) {
        this.transactions = [];
    }

    public add(transaction: Transaction) {
        // Check if the transaction is already in the mempool
        if (this.transactions.find((tx) => tx.hash === transaction.hash)) {
            console.log(`Transaction already in mempool: ${transaction.hash}`);
            return;
        }

        // Check if the mempool is full
        if (this.transactions.length >= this.maxSize) {
            console.log(`Mempool is full: ${this.transactions.length} / ${this.maxSize}`);
        }

        // Check if the transaction is valid
        if (!transaction.verify()) {
            throw new Error("Invalid transaction");
        }
        console.log(`Adding transaction to mempool: ${transaction.hash}`);

        this.transactions.push(transaction);
    }

    public get(): Transaction[] {
        // Order transactions by timestamp
        return this.transactions.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    }

    public clear() {
        this.transactions = [];
    }

}

let instance: Mempool;
export const getMempoolInstance = () => {
    if (!instance) {
        instance = new Mempool();
    }
    return instance;
}

