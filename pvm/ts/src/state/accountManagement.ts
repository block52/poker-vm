import { Account } from "../models/account";
import Accounts from "../schema/accounts";
import { Transaction } from "../models/transaction";

export class AccountManagement {
  constructor() {

  }

  async createAccount(address: string): Promise<Account> {
    const account = new Account(address, 0n);
    await Accounts.create(account.toDocument());
    return account;
  }

  async getAccount(address: string): Promise<Account> {
    const account = await Accounts.findOne({ address });

    if (!account) {
      return Account.create(address);
    }

    return Account.fromDocument(account);
  }

  // Helper functions
  async getBalance(address: string): Promise<bigint> {
    const account = await this.getAccount(address);
    return account.balance;
  }

  async incrementBalance(address: string, balance: bigint): Promise<void> {
    await Accounts.updateOne({ address }, { $inc: { balance } });
  }

  async decrementBalance(address: string, balance: bigint): Promise<void> {
    await Accounts.updateOne({ address }, { $inc: { balance: -balance } });
  }

  async applyTransaction(tx: Transaction) {
      // Deduct from sender
      if (tx.from) {
        this.decrementBalance(tx.from, tx.value);
      }

      // Add to recipient
      this.incrementBalance(tx.to, tx.value);
  }

  async applyTransactions(txs: Transaction[]): Promise<void> {
    for (const tx of txs) {
      await this.applyTransaction(tx);
    }
  }

}

export default AccountManagement;
