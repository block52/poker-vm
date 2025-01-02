import Transactions from "../schema/transactions";
import { Transaction } from "../models/transaction";
import { StateManager } from "./stateManager";
import { TransactionList } from "../models/transactionList";

export class TransactionManagement extends StateManager {
    constructor() {
        super(process.env.DB_URL || "mongodb://localhost:27017/pvm");
    }

    public async addTransaction(tx: Transaction): Promise<void> {
        await this.connect();
        const newTransaction = new Transactions(tx.toDocument());
        await newTransaction.save();
    }

    public async addTransactions(txs: Transaction[]): Promise<void> {
        await this.connect();
        const transactions = txs.map(tx => new Transactions(tx.toDocument()));
        await Transactions.insertMany(transactions);
    }

    async exists(txid: string): Promise<Boolean> {
        await this.connect();
        const tx = await Transactions.findOne({ hash: txid });
        return tx !== null;
    }

    public async getTransactions(blockHash: string, count?: number): Promise<TransactionList> {
        await this.connect();

        const transactions = await Transactions.find({ blockHash })
            .sort({ timestamp: -1 })
            .limit(count ?? 100);

        const txs = transactions.map(tx => Transaction.fromDocument(tx));
        return new TransactionList(txs);
    }

    public async getTransaction(txid: string): Promise<Transaction | null> {
        await this.connect();
        const tx = await Transactions.findOne({ hash: txid });
        if (!tx) {
            return null;
        }
        return Transaction.fromDocument(tx);
    }

    public async getTransactionByIndex(index: string): Promise<Transaction | null> {
        await this.connect();
        const tx = await Transactions.findOne({ index });
        if (!tx) {
            return null;
        }
        return Transaction.fromDocument(tx);
    }

    public async getTransactionByData(data: string): Promise<Transaction | null> {
        await this.connect();
        const tx = await Transactions.findOne({ data });
        if (!tx) {
            return null;
        }
        return Transaction.fromDocument(tx);
    }
}

// export default TransactionManagement;
let instance: TransactionManagement;
export const getTransactionInstance = (): TransactionManagement => {
    if (!instance) {
        instance = new TransactionManagement();
    }
    return instance;
};