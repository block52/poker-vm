import { Account } from "../models/account";
import Accounts from "../schema/accounts";
import { IAccountDocument } from "../models/interfaces";
import { Transaction } from "../models/transaction";
import { CONTRACT_ADDRESSES } from "../core/constants";
import { StateManager } from "./stateManager";

export class AccountManagement extends StateManager {
    constructor() {
        super(process.env.DB_URL || "mongodb://localhost:27017/pvm");
    }

    async createAccount(privateKey: string): Promise<Account> {
        const account = Account.create(privateKey);

        // If this account already exists, just return the existing account
        if (await this._getAccount(account.address)) {
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
        await this.connect();
        return await Accounts.findOne({ address });
    }

    // Helper functions
    async getBalance(address: string): Promise<bigint> {
        const account = await this.getAccount(address);

        return account.balance;
    }

    async incrementBalance(address: string, amount: bigint): Promise<void> {
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
                await Accounts.updateOne(
                    { address }, 
                    { $set: { balance: balance.toString() } }
                );
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

let instance: AccountManagement;
export const getAccountManagementInstance = (): AccountManagement => {
  if (!instance) {
    instance = new AccountManagement();
  }
  return instance;
}
