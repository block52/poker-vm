import { TransactionList } from "../models/transactionList";
import { getTransactionInstance, TransactionManagement } from "../state/transactionManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class GetTransactionsCommand implements ISignedCommand<TransactionList> {
    private readonly transactionManagement: TransactionManagement;
    private readonly count: number;
    private readonly blockHash: string;

    constructor(count: number, blockHash: string, private readonly privateKey: string) {
        this.transactionManagement = getTransactionInstance();
        this.count = count;
        this.blockHash = blockHash;
    }

    public async execute(): Promise<ISignedResponse<TransactionList>> {
        const transactionList = await this.transactionManagement.getTransactions(this.blockHash, this.count);
        return signResult(transactionList, this.privateKey);
    }
}
