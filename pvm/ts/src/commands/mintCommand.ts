import { ethers } from "ethers";
import { getMempoolInstance } from "../core/mempool";
import { Transaction } from "../models/transaction";
import transactions from "../schema/transactions";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class MintCommand implements ISignedCommand<Transaction> {
    constructor(
        readonly receiver: string,
        readonly amount: bigint,
        readonly transactionId: string,
        readonly publicKey: string;
        private readonly privateKey: string
    ) {
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
        const signer = new ethers.Wallet(privateKey);
        this.publicKey = signer.address;
    }

    public async execute(): Promise<ISignedResponse<Transaction>> {
        // Minting logic
        // Check tx hash is in the staking mainnet contract and has not be validated
        // If we're a validator, we can mint
        // Check the DB for the tx hash
        // If it's not in the DB, mint

        const existingTx = await transactions.findOne({ hash: this.transactionId });
        if (existingTx) {
            return signResult(Transaction.fromDocument(existingTx), this.privateKey);
        }

        const mintTx: Transaction = Transaction.create(this.receiver, this.publicKey, this.amount, this.privateKey);
        
        // Send to mempool
        const mempoolInstance = getMempoolInstance();
        await mempoolInstance.add(mintTx);
        return signResult(mintTx, this.privateKey);
    }
}
