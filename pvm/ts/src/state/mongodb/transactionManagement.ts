import Transactions from "../../schema/transactions";
import { Transaction } from "../../models/transaction";
import { StateManager } from "../stateManager";
import { ITransactionManagement } from "../interfaces";

export class TransactionManagement extends StateManager implements ITransactionManagement {
    constructor(protected readonly connString: string) {
        super(connString);
    }

    public async addTransaction(tx: Transaction): Promise<void> {
        await this.connect();
        const newTransaction = new Transactions(tx.toDocument());
        await newTransaction.save();
    }

    public async addTransactions(txs: Transaction[], blockHash: string): Promise<void> {
        await this.connect();

        const transactions = txs.map(tx => {
            tx.blockHash = blockHash;
            return new Transactions(tx.toDocument());
        });

        if (transactions.length > 0) {
            await Transactions.insertMany(transactions);
        }
    }

    public async exists(txid: string): Promise<Boolean> {
        await this.connect();
        const tx = await Transactions.findOne({ hash: txid });
        return tx !== null;
    }

    public async getTransactions(blockHash: string, count?: number): Promise<Transaction[]> {
        await this.connect();

        const transactions = await Transactions.find({ block_hash: blockHash })
            .sort({ timestamp: -1 })
            .limit(count ?? 100);

        const txs = transactions.map(tx => Transaction.fromDocument(tx));
        return txs;
    }

    public async getTransactionsByAddress(address: string, count?: number): Promise<Transaction[]> {
        await this.connect();
        const transactions = await Transactions.find({ to: address })
            .sort({ timestamp: -1 })
            .limit(count ?? 100);

        return transactions.map(tx => Transaction.fromDocument(tx));
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
export const getTransactionInstance = (): ITransactionManagement => {
    if (!instance) {
        instance = new TransactionManagement();
    }
    return instance;
};
