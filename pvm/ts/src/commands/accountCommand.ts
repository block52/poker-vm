import { getMempoolInstance, Mempool } from "../core/mempool";
import { Account } from "../models";
import { getAccountManagementInstance } from "../state/index";
import { IAccountManagement } from "../state/interfaces";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class AccountCommand implements ISignedCommand<Account> {
    private readonly accountManagement: IAccountManagement;
    private readonly mempool: Mempool;
    private readonly address: string;

    constructor(address: string, private readonly privateKey: string) {
        this.accountManagement = getAccountManagementInstance();
        this.mempool = getMempoolInstance();
        this.address = address;
        this.privateKey = privateKey;
    }

    public async execute(): Promise<ISignedResponse<Account>> {
        const account = await this.accountManagement.getAccount(this.address);

        const fromTxs = this.mempool.findAll(tx => tx.from === this.address);
        const toTxs = this.mempool.findAll(tx => tx.to === this.address);

        const from = fromTxs ? fromTxs.reduce((acc, tx) => acc + tx.value, 0n) : 0n;
        const to = toTxs.reduce((acc, tx) => acc + tx.value, 0n);

        // The next nonce to use should account for pending transactions from this address
        // If account has nonce 3 and 2 pending transactions, next nonce should be 5
        const nextNonce = account.nonce + (fromTxs ? fromTxs.length : 0);
        const _account = new Account(this.address, account.balance + to - from, nextNonce);

        return signResult(_account, this.privateKey);
    }
}
