import { Account } from "../../models/account";
import Accounts from "../../schema/accounts";
import { IAccountDocument } from "../../models/interfaces";
import { Transaction } from "../../models/transaction";
import { CONTRACT_ADDRESSES } from "../../core/constants";
import { StateManager } from "../stateManager";
import { IAccountManagement } from "../interfaces";

export class AccountManagement extends StateManager implements IAccountManagement {
    constructor(protected readonly connString: string) {
        super(connString);
    }

    public async createAccount(privateKey: string): Promise<Account> {
        const account = Account.create(privateKey);

        // If this account already exists, just return the existing account
        if (await this._getAccount(account.address)) {
            return this.getAccount(account.address);
        }

        await Accounts.create(account.toDocument());
        return account;
    }

    public async getAccount(address: string): Promise<Account> {
        const account = await this._getAccount(address);

        if (!account) {
            return new Account(address, 0n);
        }

        return Account.fromDocument(account);
    }

    private async _getAccount(address: string): Promise<IAccountDocument | null> {
        await this.connect();
        return await Accounts.findOne({ address });
    }

    // Helper functions
    public async getBalance(address: string): Promise<bigint> {
        const account = await this.getAccount(address);

        return account.balance;
    }

    public async incrementBalance(address: string, amount: bigint): Promise<void> {
        if (amount < 0n) {
            // throw new Error("Balance must be positive");
            console.log("Balance must be positive");
            return;
        }

        // Not sure why this is necessary?  Maybe burn?
        if (address !== CONTRACT_ADDRESSES.bridgeAddress) {
            await this.connect();

            const account = await Accounts.findOne({ address });
            if (!account) {
                await Accounts.create({ address, balance: amount.toString(), nonce: 0 });
            } else {
                let balance = BigInt(account.balance);
                if (balance + amount < 0n) {
                    // throw new Error("Insufficient funds");
                    console.log("Insufficient funds");
                    return;
                }

                balance += amount;
                await Accounts.updateOne({ address }, { $set: { balance: balance.toString() } });
            }
        }
    }

    async decrementBalance(address: string, amount: bigint): Promise<void> {
        if (amount < 0n) {
            // throw new Error("Balance must be positive");
            console.log("Balance must be positive");
            return;
        }

        if (address !== CONTRACT_ADDRESSES.bridgeAddress) {
            await this.connect();
            const account = await Accounts.findOne({ address });
            if (!account) {
                // throw new Error("Account not found");
                console.log("Account not found");
                return;
            }

            const balance = BigInt(account.balance);
            if (balance - amount < 0n) {
                // throw new Error("Insufficient funds");
                console.log("Insufficient funds");
                return;
            }

            await Accounts.updateOne({ address }, { $inc: { balance: (-amount).toString() } });
        }
    }

    public async applyTransaction(tx: Transaction): Promise<void> {
        await this.connect();

        // Handle sender account (deduct balance and increment nonce)
        if (tx.from) {
            const account = await Accounts.findOne({ address: tx.from });
            
            // For MINT transactions or other special transactions, the sender might not exist
            // Only process sender if account exists (normal transactions)
            if (account) {
                const balance = BigInt(account.balance);
                if (balance - tx.value < 0n) {
                    console.log("Insufficient funds");
                    return;
                }

                const newBalance = balance - tx.value;
                const newNonce = account.nonce + 1; // Increment nonce for sender

                await Accounts.updateOne(
                    { address: tx.from },
                    { 
                        $set: { 
                            balance: newBalance.toString(),
                            nonce: newNonce
                        } 
                    }
                );
            } else {
                // For transactions like MINT where sender doesn't exist, just log it
                console.log(`Sender account ${tx.from} not found - assuming special transaction (MINT, etc.)`);
            }
        }

        // Handle recipient account (increment balance only)
        if (tx.to) {
            await this.incrementBalance(tx.to, tx.value);
        }
    }

    public async applyTransactions(txs: Transaction[]): Promise<void> {
        for (const tx of txs) {
            await this.applyTransaction(tx);
        }
    }
}

let instance: AccountManagement;
export const getMongoAccountManagementInstance = (): IAccountManagement => {
    const connString = process.env.DB_URL || "mongodb://localhost:27017/pvm";
    if (!instance) {
        instance = new AccountManagement(connString);
    }
    return instance;
};
