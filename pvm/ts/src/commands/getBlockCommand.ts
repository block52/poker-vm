
import { Block } from "../models/block";
import { BlockchainManagement, getBlockchainInstance } from "../state/blockchainManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { getTransactionInstance, TransactionManagement } from "../state/transactionManagement";

export class GetBlockCommand implements ISignedCommand<Block> {
    private readonly blockchainManagement: BlockchainManagement;
    private readonly transactionManagement: TransactionManagement;

    constructor(
        private readonly hash: string,
        private readonly count: number = 100,
        private readonly privateKey: string
    ) {
        this.blockchainManagement = getBlockchainInstance();
        this.transactionManagement = getTransactionInstance();
    }

    public async execute(): Promise<ISignedResponse<Block>> {
        const block: Block = await this.blockchainManagement.getBlockByHash(this.hash);
        const transactions = await this.transactionManagement.getTransactions(this.hash);

        block.transactions.push(...transactions);

        return signResult(block, this.privateKey);
    }
}   