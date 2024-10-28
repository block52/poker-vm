import { Transaction } from "../models";
import { TransactionList } from "../models/transactionList";
import { BlockchainManagement } from "../state/blockchainManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class GetTransactionsCommand implements ISignedCommand<TransactionList> {
    private readonly blockchainManagement: BlockchainManagement;
    private readonly count: number;

    constructor(count: number, private readonly privateKey: string) {
        this.blockchainManagement = new BlockchainManagement();
        this.count = count;
    }

    public async execute(): Promise<ISignedResponse<TransactionList>> {
        const transactionList = await this.blockchainManagement.getTransactions(this.count);
        return signResult(transactionList, this.privateKey);
    }
}
