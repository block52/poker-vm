import { KEYS, NonPlayerActionType, PlayerActionType, TransactionResponse } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models";
import { signResult } from "./abstractSignedCommand";
import { ICommand, ISignedResponse } from "./interfaces";
import { AccountCommand } from "./accountCommand";
import { PerformActionCommandWithResult } from "./performActionCommandWithResult";

export class TransferCommand implements ICommand<ISignedResponse<TransactionResponse>> {
    
    private readonly accountToContractActions: NonPlayerActionType[] = [
        NonPlayerActionType.JOIN
    ];

    private readonly contractToAccountActions: NonPlayerActionType[] = [
        NonPlayerActionType.LEAVE
    ];

    private readonly mempool: Mempool;
    
    /**
     * Creates a new TransferCommand instance.
     * @param from The address sending the funds.
     * @param to The address receiving the funds.
     * @param amount The amount of funds to transfer.
     * @param nonce The nonce for the transaction.
     * @param data Optional data to include with the transaction.
     * @param privateKey The private key of the sender's account.
     */
    constructor(
        private readonly from: string,
        private readonly to: string,
        private readonly amount: bigint,
        private readonly nonce: number,
        private data: string | null,
        private readonly privateKey: string
    ) {
        console.log(`Creating TransferCommand: from=${from}, to=${to}, amount=${amount}, data=${data}`);
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<TransactionResponse>> {
        if (!Number.isInteger(this.nonce) || this.nonce < 0) {
            throw new Error("Invalid nonce: must be a non-negative integer");
        }
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
            const transaction: Transaction = await Transaction.create(this.to, this.from, this.amount, BigInt(this.nonce), this.privateKey, this.data ?? "");
            this.mempool.add(transaction); // Add to mempool immediately
            
            if (this.data) {
                // Assume the SDK is correct
                const urlSearch = new URLSearchParams(this.data);
                const playerActionStr = urlSearch.get(KEYS.ACTION_TYPE);
                const indexStr = urlSearch.get(KEYS.INDEX);
                const valueStr = urlSearch.get(KEYS.VALUE);

                const index = indexStr ? parseInt(indexStr) : 0; // Default to 0 if not provided
                const value = valueStr ? BigInt(valueStr) : BigInt(0); //

                // I think we can always safely do this regardless of the action type
                if (playerActionStr && this.accountToContractActions.includes(playerActionStr as NonPlayerActionType)) {
                    const playerAction = playerActionStr.trim() as PlayerActionType | NonPlayerActionType;
                    const performAction = new PerformActionCommandWithResult(this.from, this.to, index, value, playerAction, this.nonce, this.privateKey, this.data);
                    await performAction.execute();
                    console.log(`Performed action: ${playerAction} from ${this.from} to ${this.to} with amount ${value ? BigInt(value) : BigInt(0)}`);
                }

                // I think we can always safely do this regardless of the action type
                if (playerActionStr && this.contractToAccountActions.includes(playerActionStr as NonPlayerActionType)) {
                    const playerAction = playerActionStr.trim() as PlayerActionType | NonPlayerActionType;
                    const to = this.from; // Reverse the from/to for contract to account actions
                    const from = this.to; // Reverse the from/to for contract to account actions
                    const performAction = new PerformActionCommandWithResult(from, to, index, value, playerAction, this.nonce, this.privateKey, this.data);
                    await performAction.execute();
                    console.log(`Performed action: ${playerAction} from ${from} to ${to} with amount ${value ? BigInt(value) : BigInt(0)}`);
                }

                // // If the transaction is account to contract or contract to account, we add it to the mempool
                // if (playerActionStr && !this.mempool.has(transaction.hash) && (this.accountToContractActions.includes(playerActionStr as NonPlayerActionType) || this.contractToAccountActions.includes(playerActionStr as NonPlayerActionType))) {
                //     console.log(`Adding transaction to mempool for game action: ${this.data}`);
                    
                //     await this.mempool.add(transaction);
                // }
            }

            // Add normal transaction to mempool if it doesn't already exist
            if (!this.data && !this.mempool.has(transaction.hash)) {
                console.log(`Adding transaction to mempool: ${transaction.hash}`);
                await this.mempool.add(transaction);
            }

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
