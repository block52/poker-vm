import { Account } from "../models/account";
import { getAccountManagementInstance } from "../state/accountManagement";
import { IAccountManagement } from "../state/interfaces";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class CreateAccountCommand implements ISignedCommand<Account> {
    private readonly accountManagement: IAccountManagement;

    constructor(private readonly privateKey: string) {
        this.accountManagement = getAccountManagementInstance();
    }

    public async execute(): Promise<ISignedResponse<Account>> {
        const account = await this.accountManagement.createAccount(this.privateKey);
        return signResult(account, this.privateKey);
    }
}
