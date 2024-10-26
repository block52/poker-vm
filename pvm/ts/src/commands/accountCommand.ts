import { Account } from "../models";
import AccountManagement from "../state/accountManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class AccountCommand implements ISignedCommand<Account> {
    private readonly accountManagement: AccountManagement;
    private readonly address: string;

    constructor(address: string, private readonly privateKey: string) {
        this.accountManagement = new AccountManagement();
        this.address = address;
        this.privateKey = privateKey;
    }

    public async execute(): Promise<ISignedResponse<Account>> {
        const account = await this.accountManagement.getAccount(this.address);
        return signResult(account, this.privateKey);
    }
}
