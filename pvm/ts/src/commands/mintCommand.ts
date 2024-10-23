import { getMempoolInstance } from "../core/mempool";
import { Transaction } from "../models/transaction";
import transactions from "../schema/transactions";
import { ICommand } from "./interfaces";

export class MintCommand implements ICommand<Transaction> {
    constructor(readonly receiver: string, readonly amount: bigint, readonly transactionId: string, readonly privateKey: string) {
        if (amount <= 0) {
            throw new Error("Amount must be greater than 0");
        }

        if (!receiver) {
            throw new Error("Receiver must be provided");
        }

        if (!transactionId) {
            throw new Error("Transaction ID must be provided");
        }

        if (!privateKey) {
            throw new Error("Private key must be provided");
        }

        this.receiver = receiver;
        this.amount = amount;
        this.transactionId = transactionId;
        this.privateKey = privateKey;
    }

    public async execute(): Promise<Transaction> {
        // Minting logic
        // Check tx hash is in the staking mainnet contract and has not be validated
        // If we're a validator, we can mint
        // Check the DB for the tx hash
        // If it's not in the DB, mint

        const existingTx = await transactions.findOne({ hash: this.transactionId });
        if (existingTx) {
            return Transaction.fromDocument(existingTx);
        }

        const mintTx: Transaction = Transaction.create(this.receiver, null, this.amount, this.privateKey);
        // Send to mempool
        const mempoolInstance = getMempoolInstance();
        mempoolInstance.add(mintTx);
        return mintTx;

    }
}
