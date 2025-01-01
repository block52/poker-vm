import { getMempoolInstance, Mempool } from "../core/mempool";
import { Block, Transaction } from "../models";

import { BlockchainManagement, getBlockchainInstance } from "../state/blockchainManagement";
import { getTransactionInstance, TransactionManagement } from "../state/transactionManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class MineCommand implements ISignedCommand<Block | null> {
    private readonly mempool: Mempool;
    private readonly blockchainManagement: BlockchainManagement;
    private readonly transactionManagement: TransactionManagement;

    constructor(private readonly privateKey: string) {
        this.mempool = getMempoolInstance();
        this.blockchainManagement = getBlockchainInstance();
        this.transactionManagement = getTransactionInstance();
    }

    public async execute(): Promise<ISignedResponse<Block | null>> {
        const txs = this.mempool.get();
        
        if (txs.length === 0) {
            return signResult(null, this.privateKey);
        }

        const validTxs: Transaction[] = this.validate(txs);
        const uniqueTxs: Transaction[] = await this.filter(validTxs);

        const lastBlock = await this.blockchainManagement.getLastBlock();

        const block = Block.create(
            lastBlock.index + 1,
            lastBlock.hash,
            uniqueTxs,
            this.privateKey
        );

        // Write to DB

        // Do in parallel
        await Promise.all([
            this.blockchainManagement.addBlock(block),
            this.transactionManagement.addTransactions(uniqueTxs),
            this.mempool.clear()
        ]);

        // await this.blockchainManagement.addBlock(block);
        // await this.transactionManagement.addTransactions(uniqueTxs);
        // await this.mempool.clear();

        return signResult(block, this.privateKey);
    }

    private validate(txs: Transaction[]): Transaction[] {
        const validTxs: Transaction[] = [];
        for (const tx of txs) {
            if (tx.verify()) {
                validTxs.push(tx);
            }
        }
        return validTxs;
    }

    private unique(txs: Transaction[]): Transaction[] {
        const txMap = new Map<string, Transaction>();
        for (const tx of txs) {
            txMap.set(tx.hash, tx);
        }
        return Array.from(txMap.values());
    }

    private async filter(txs: Transaction[]): Promise<Transaction[]> {
        const validTxs: Transaction[] = [];

        for (let i = 0; i < txs.length; i++) {
            const tx = txs[i];
            if (await this.transactionManagement.exists(tx.hash)) {
                continue;
            }
            validTxs.push(tx);
        }

        return validTxs;
    }
}
