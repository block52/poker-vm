import { Account } from "../models";
import AccountManagement from "../state/accountManagement";
import { ICommand } from "./interfaces";

export class AccountCommand implements ICommand<Account> {
  private readonly accountManagement: AccountManagement;
  private readonly address: string;

  constructor(address: string) {
    this.accountManagement = new AccountManagement();
    this.address = address;
  }

  public async executeCommand(): Promise<Account> {
    const account = await this.accountManagement.getAccount(this.address);
    return account;
  }
}
