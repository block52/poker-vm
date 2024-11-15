import { Account } from "../models/account";
import Accounts from "../schema/accounts";
import { IAccountDocument } from "../models/interfaces";
import { Transaction } from "../models/transaction";

export class AccountManagement {
    constructor() {}

    async createAccount(privateKey: string): Promise<Account> {
        const account = Account.create(privateKey);

        const existingAccount = await this._getAccount(account.address);
        if (existingAccount) {
            return this.getAccount(account.address);
        }

        await Accounts.create(account.toDocument());
        return account;
    }

    async getAccount(address: string): Promise<Account> {
        const account = await this._getAccount(address);

        if (!account) {
            return new Account(address, 0n);
        }

        return Account.fromDocument(account);
    }

    async _getAccount(address: string): Promise<IAccountDocument | null> {
        return Accounts.findOne({ address });
    }

    // Helper functions
    async getBalance(address: string): Promise<bigint> {
        const account = await this.getAccount(address);

        return account.balance;
    }

    async incrementBalance(address: string, balance: bigint): Promise<void> {
        await Accounts.updateOne({ address }, { $inc: { balance: balance.toString() } });
    }

    async decrementBalance(address: string, balance: bigint): Promise<void> {
        await Accounts.updateOne({ address }, { $inc: { balance: (-balance).toString() } });
    }

    async applyTransaction(tx: Transaction) {
        // Deduct from sender
        if (tx.from) {
            await this.decrementBalance(tx.from, tx.value);
        }

        // Add to recipient
        if (tx.to) {
            await this.incrementBalance(tx.to, tx.value);
        }
    }

    async applyTransactions(txs: Transaction[]): Promise<void> {
        for (const tx of txs) {
            await this.applyTransaction(tx);
        }
    }
}

export default AccountManagement;
