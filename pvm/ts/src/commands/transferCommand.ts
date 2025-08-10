import { TransactionResponse } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models";
import { signResult } from "./abstractSignedCommand";
import { ICommand, ISignedResponse } from "./interfaces";
import { AccountCommand } from "./accountCommand";

export class TransferCommand implements ICommand<ISignedResponse<TransactionResponse>> {
    private readonly mempool: Mempool;

    constructor(
        private readonly from: string,
        private readonly to: string,
        private readonly amount: bigint,
        private readonly nonce: number | 0,
        private data: string | null,
        private readonly privateKey: string
    ) {
        console.log(`Creating TransferCommand: from=${from}, to=${to}, amount=${amount}, data=${data}`);
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<TransactionResponse>> {
        console.log(`Executing transfer command...`);

        const accountCommand = new AccountCommand(this.from, this.privateKey);
        const accountResponse = await accountCommand.execute();
        const fromAccount = accountResponse.data;
        console.log(`Account balance for ${this.from}: ${fromAccount.balance} ${fromAccount.nonce}`);

        if (this.nonce !== fromAccount.nonce) {
            console.log(`Invalid nonce: expected=${fromAccount.nonce}, provided=${this.nonce}`);
            throw new Error("Invalid nonce");
        }

        if (this.amount > fromAccount.balance) {
            console.log(`Insufficient balance: required=${this.amount}, available=${fromAccount.balance}`);
            throw new Error("Insufficient balance");
        }

        try {
            // If we haven't thrown an error, then we can create the transaction
            const transaction: Transaction = await Transaction.create(this.to, this.from, this.amount, 0n, this.privateKey, this.data ?? "");
            await this.mempool.add(transaction);

            const txResponse: TransactionResponse = {
                nonce: this.nonce.toString(),
                from: this.from,
                to: this.to,
                value: this.amount.toString(),
                hash: transaction.hash,
                signature: transaction.signature,
                timestamp: transaction.timestamp.toString(),
                data: transaction.data ?? ""
            };

            return signResult(txResponse, this.privateKey);
        } catch (e) {
            console.error(`Error in transfer command:`, e);
            throw new Error("Error transferring funds");
        }
    }
}
