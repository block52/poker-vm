import { Transaction } from "../models/transaction";
import Blocks from "../schema/blocks";
import { getTransactionInstance, TransactionManagement } from "../state/transactionManagement";

export class Mempool {
    private readonly txMap = new Map<string, Transaction>();
    private readonly transactionManagement: TransactionManagement;

    constructor(readonly maxSize: number = 100) {
        this.transactionManagement = getTransactionInstance();
    }

    public async add(transaction: Transaction): Promise<void> {
        // Check if this transaction is already in the mempool by hash
        if (this.txMap.has(transaction.hash)) {
            console.log(`Transaction already in mempool (hash match): ${transaction.hash}`);
            console.log(`Transaction data: ${transaction.data}, from: ${transaction.from}, to: ${transaction.to}`);
            return;
        }

        // Also check for potential duplicates by content (same from, to, data, amount)
        // This is a backup check in case hash calculation isn't consistent
        const potentialDuplicate = this.find(tx => 
            tx.from.toLowerCase() === transaction.from.toLowerCase() &&
            tx.to.toLowerCase() === transaction.to.toLowerCase() &&
            tx.data === transaction.data &&
            tx.value === transaction.value
        );

        if (potentialDuplicate) {
            console.log(`Potential duplicate transaction detected in mempool (content match):`);
            console.log(`Existing: ${potentialDuplicate.hash}, data: ${potentialDuplicate.data}`);
            console.log(`New: ${transaction.hash}, data: ${transaction.data}`);
            // Still add it since we can't be 100% sure it's a duplicate without proper hash calculation
        }

        const exists = await this.transactionManagement.exists(transaction.hash);
        if (exists) {
            console.log(`Transaction already in blockchain: ${transaction.hash}`);
            return;
        }

        if (this.txMap.size >= this.maxSize) {
            console.log(`Mempool is full: ${this.txMap.size} / ${this.maxSize}`);
            return;
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

        this.txMap.set(transaction.hash, transaction);
        console.log(`Added transaction to mempool: ${transaction.hash}, data: ${transaction.data}`);
    }

    public get(): Transaction[] {
        // Order transactions by timestamp
        const txs: Transaction[] = Array.from(this.txMap.values());
        return txs.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    }

    public getTransaction(hash: string): Transaction | undefined {
        return this.txMap.get(hash);
    }

    public find(predicate: (tx: Transaction) => boolean): Transaction | undefined {
        return Array.from(this.txMap.values()).find(predicate);
    }

    public findAll(predicate: (tx: Transaction) => boolean): Transaction[] {
        return Array.from(this.txMap.values()).filter(predicate);
    }

    public remove(hash: string) {
        this.txMap.delete(hash);
    }

    public async purge() {
        for (const tx of this.txMap.values()) {
            if (await this.transactionManagement.exists(tx.hash)) {
                this.txMap.delete(tx.hash);
            }
        }
    }

    public clear() {
        this.txMap.clear();
    }
}

let instance: Mempool;
export const getMempoolInstance = (): Mempool => {
    if (!instance) {
        instance = new Mempool();
    }
    return instance;
};
