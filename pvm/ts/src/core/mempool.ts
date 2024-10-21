//import { Transaction } from "ethers";

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

    public get(): Transaction[] {
        return this.transactions;
    }

}

export class MempoolTransactions implements IJSONModel {
    constructor(private transactions: Transaction[]) {
      this.transactions = transactions;
    }
  
    public toJson(): TransactionDTO[] {
      return this.transactions.map((tx) => tx.toJson());
    }
  }
  

let instance: Mempool;
export const getInstance = () => {
    if (!instance) {
        instance = new Mempool();
    }
    return instance;
}
