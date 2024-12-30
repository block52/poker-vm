import Blocks from "../schema/blocks";
import { Transaction } from "../models/transaction";
import { StateManager } from "./stateManager";

export class TransactionManagement extends StateManager {
    constructor() {
        super(process.env.DB_URL || "mongodb://localhost:27017/pvm");
    }

    async exists(txid: string): Promise<Boolean> {
        await this.connect();

        try {
            let currentBlockIndex = 0;
            const lastBlock = await Blocks.findOne().sort({ index: -1 });

            if (lastBlock) {
                currentBlockIndex = lastBlock.index;
            }

            // Query blocks with index less than current block
            const existingBlock = await Blocks.findOne({
                index: { $lt: currentBlockIndex },
                "transactions.id": txid
            }).exec();

            if (existingBlock && existingBlock.transactions) {
                const transaction = existingBlock.transactions.find((tx) => tx.id === txid);
                return transaction !== undefined;
            }

            return false;
        } catch (error) {
            console.error("Error checking transaction existence:", error);
            throw error;
        }
    }

    // async getTransaction(txid: string): Promise<Transaction> {
    //     await this.connect();

    //     try {
    //         let currentBlockIndex = 0;
    //         const lastBlock = await Blocks.findOne().sort({ index: -1 });

    //         if (lastBlock) {
    //             currentBlockIndex = lastBlock.index;
    //         }

    //         // Query blocks with index less than current block
    //         const existingBlock = await Blocks.findOne({
    //             index: { $lt: currentBlockIndex },
    //             "transactions.id": txid
    //         }).exec();

    //         if (existingBlock && existingBlock.transactions) {
    //             const transaction = existingBlock.transactions.find((tx) => tx.id === txid);
    //             return transaction;
    //         }
    //     } catch (error) {
    //         console.error("Error checking transaction existence:", error);
    //         throw error;
    //     }
    // }
}

export default TransactionManagement;
