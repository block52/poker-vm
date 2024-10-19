import { Account } from "../models/account";
import { Accounts } from "../schema/accounts";

export class AccountManagement {
  constructor() {

  }

  async createAccount(address: string): Promise<Account> {
    const account = new Account(address, 0);
    await Accounts.create(account.toJson());
    return account;
  }

  async getAccount(address: string): Promise<Account> {
    const account = await Accounts.findOne({ address });

    if (!account) {
      return Account.create(address);
    }

    return Account.fromJson(account);
  }

  // Helper functions
  async getBalance(address: string): Promise<number> {
    const account = await this.getAccount(address);
    return account.balance;
  }

  async incrementBalance(address: string, balance: number): Promise<void> {
    await Accounts.updateOne({ address }, { $inc: { balance } });
  }
}