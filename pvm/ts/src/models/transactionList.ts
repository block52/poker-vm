import { TransactionDTO } from "@bitcoinbrisbane/block52";
import { IJSONModel } from "./interfaces";
import { Transaction } from "./transaction";

export class TransactionList implements IJSONModel {
    constructor(private transactions: Transaction[]) {
        this.transactions = transactions;
    }

    public toJson(): TransactionDTO[] {
        return this.transactions.map(tx => tx.toJson());
    }
}
