import { Transaction } from "ethers";

export class Mempool {

    private transactions: Transaction[];

    constructor(readonly maxSize: number = 100) {
        this.transactions = [];
    }

    add(transaction: Transaction) {
        // Check if the transaction is already in the mempool
        if (this.transactions.find((tx) => tx.hash === transaction.hash)) {
            return;
        }

        // Check if the mempool is full
        if (this.transactions.length >= this.maxSize) {
            throw new Error("Mempool is full");
        }

        // Check if the transaction is valid
        // if (!transaction.isValid) {
        //     throw new Error("Invalid transaction");
        // }

        this.transactions.push(transaction);
    }

    get() {
        return this.transactions;
    }
}