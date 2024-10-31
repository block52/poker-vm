import { ethers } from "ethers";
import { getMempoolInstance } from "../core/mempool";
import { Transaction } from "../models";
import accounts from "../schema/accounts";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class BurnCommand implements ISignedCommand<Transaction> {
    constructor(
        readonly receiver: string,
        readonly amount: bigint,
        private readonly privateKey: string
    ) {
        if (amount <= 0) {
            throw new Error("Amount must be greater than 0");
        }

        if (!receiver) {
            throw new Error("Receiver must be provided");
        }

        if (!privateKey) {
            throw new Error("Private key must be provided");
        }

        this.receiver = receiver;
        this.amount = amount;
        this.privateKey = privateKey;
    }

    public async execute(): Promise<ISignedResponse<Transaction>> {
        // Minting logic
        // Check tx hash is in the staking mainnet contract and has not be validated
        // If we're a validator, we can mint
        // Check the DB for the tx hash
        // If it's not in the DB, mint

        const account = await accounts.findOne({ address: this.receiver });
        if (account) {
            // return signResult(Transaction.fromDocument(existingTx), this.privateKey);
            // throw new Exception();
        }

        if (this.amount > Number(account?.balance)) {
            // throw ...
        }

        const validator: string = ethers.ZeroAddress;
        const burnTx: Transaction = Transaction.create(this.receiver, validator, this.amount, this.privateKey);
        
        // Send to mempool
        const mempoolInstance = getMempoolInstance();
        await mempoolInstance.add(burnTx);
        return signResult(burnTx, this.privateKey);
    }
}
