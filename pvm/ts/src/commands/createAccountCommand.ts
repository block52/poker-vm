import { Account } from "../models/account";
import AccountManagement from "../state/accountManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class CreateAccountCommand implements ISignedCommand<Account> {

    constructor(private readonly privateKey: string) {}

    public async execute(): Promise<ISignedResponse<Account>> {
        const accountManagement = new AccountManagement();
        const account = await accountManagement.createAccount(this.privateKey);
        return signResult(account, this.privateKey);
    }
}   