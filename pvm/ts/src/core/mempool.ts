import { Transaction } from "../models/transaction";
import Blocks from "../schema/blocks";
import { ITransactionManagement } from "../state/interfaces";
import { getTransactionInstance } from "../state/index";
import { getSocketService } from "./socketserver";

export class Mempool {
    private readonly txMap = new Map<string, Transaction>();
    private readonly transactionManagement: ITransactionManagement;

    constructor(readonly maxSize: number = 4000) {
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
        
        // Broadcast mempool update via WebSocket
        const socketService = getSocketService();
        if (socketService) {
            try {
                await socketService.broadcastMempoolUpdate();
                console.log(`Broadcasted mempool update after adding transaction: ${transaction.hash}`);
            } catch (error) {
                console.error("Error broadcasting mempool update:", error);
            }
        }
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
        
        // Broadcast mempool update via WebSocket when transaction is removed
        const socketService = getSocketService();
        if (socketService) {
            socketService.broadcastMempoolUpdate().catch(error => {
                console.error("Error broadcasting mempool update after removal:", error);
            });
        }
    }

    public async purge() {
        let purgedCount = 0;
        for (const tx of this.txMap.values()) {
            if (await this.transactionManagement.exists(tx.hash)) {
                this.txMap.delete(tx.hash);
                purgedCount++;
            }
        }
        
        // Broadcast mempool update if any transactions were purged
        if (purgedCount > 0) {
            const socketService = getSocketService();
            if (socketService) {
                try {
                    await socketService.broadcastMempoolUpdate();
                    console.log(`Broadcasted mempool update after purging ${purgedCount} transactions`);
                } catch (error) {
                    console.error("Error broadcasting mempool update after purge:", error);
                }
            }
        }
    }

    public clear() {
        this.txMap.clear();
        
        // Broadcast mempool update when cleared
        const socketService = getSocketService();
        if (socketService) {
            socketService.broadcastMempoolUpdate().catch(error => {
                console.error("Error broadcasting mempool update after clear:", error);
            });
        }
    }
}

let instance: Mempool;
export const getMempoolInstance = (): Mempool => {
    if (!instance) {
        instance = new Mempool();
    }
    return instance;
};
