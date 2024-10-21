import { TransactionDTO } from "../types/chain";
import { IJSONModel } from "./interfaces";
import { Transaction } from "./transaction";

export class MempoolTransactions implements IJSONModel {
    constructor(private transactions: Transaction[]) {
      this.transactions = transactions;
    }
  
    public toJson(): TransactionDTO[] {
      return this.transactions.map((tx) => tx.toJson());
    }
}
  

