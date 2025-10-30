import { Transaction } from "../models/transaction";
import { getSocketService } from "./socketserver";

export class Mempool {
    private readonly txMap = new Map<string, Transaction>();

    constructor(readonly maxSize: number = 4000) {
    }

    public async add(transaction: Transaction): Promise<void> {
        if (this.txMap.has(transaction.hash)) {
            console.log(`Transaction already in mempool: ${transaction.hash}`);
            return;
        }

        if (this.txMap.size >= this.maxSize) {
            console.log(`Mempool is full: ${this.txMap.size} / ${this.maxSize}`);
            return;
        }

        // Check if the transaction is valid
        if (!transaction.verify()) {
            // throw new Error("Invalid transaction");
        }

        this.txMap.set(transaction.hash, transaction);
        
        // // Broadcast mempool update via WebSocket
        // const socketService = getSocketService();
        // if (socketService) {
        //     try {
        //         await socketService.broadcastMempoolUpdate();
        //         console.log(`Broadcasted mempool update after adding transaction: ${transaction.hash}`);
        //     } catch (error) {
        //         console.error("Error broadcasting mempool update:", error);
        //     }
        // }
    }

    public get(): Transaction[] {
        // Order transactions by timestamp
        const txs: Transaction[] = Array.from(this.txMap.values());
        return txs.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    }

    public getTransaction(hash: string): Transaction | undefined {
        return this.txMap.get(hash);
    }

    public has(hash: string): boolean {
        return this.txMap.has(hash);
    }

    public find(predicate: (tx: Transaction) => boolean): Transaction | undefined {
        return Array.from(this.txMap.values()).find(predicate);
    }

    public findAll(predicate: (tx: Transaction) => boolean): Transaction[] {
        return Array.from(this.txMap.values()).filter(predicate);
    }

    public remove(hash: string) {
        this.txMap.delete(hash);
        
        // // Broadcast mempool update via WebSocket when transaction is removed
        // const socketService = getSocketService();
        // if (socketService) {
        //     socketService.broadcastMempoolUpdate().catch(error => {
        //         console.error("Error broadcasting mempool update after removal:", error);
        //     });
        // }
    }

    public async purge() {
    }

    public clear() {
        this.txMap.clear();
        
        // // Broadcast mempool update when cleared
        // const socketService = getSocketService();
        // if (socketService) {
        //     socketService.broadcastMempoolUpdate().catch(error => {
        //         console.error("Error broadcasting mempool update after clear:", error);
        //     });
        // }
    }
}

let instance: Mempool;
export const getMempoolInstance = (): Mempool => {
    if (!instance) {
        instance = new Mempool();
    }
    return instance;
};
