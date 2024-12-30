import { getMempoolInstance, Mempool } from "../core/mempool";
import { Block, Transaction } from "../models";

import { BlockchainManagement, getBlockchainInstance } from "../state/blockchainManagement";
import { getTransactionInstance, TransactionManagement } from "../state/transactionManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class MineCommand implements ISignedCommand<Block | null> {

    private readonly blockchainManagement: BlockchainManagement;
    private readonly transactionManagement: TransactionManagement;

    constructor(private readonly privateKey: string) {
        this.blockchainManagement = getBlockchainInstance();
        this.transactionManagement = getTransactionInstance();
    }

    public async execute(): Promise<ISignedResponse<Block | null>> {
        const mempool = getMempoolInstance();
        const txs = mempool.get();
        
        if (txs.length === 0) {
            return signResult(null, this.privateKey);
        }

        const validTxs = this.validate(txs);
        const uniqueTxs = await this.filter(validTxs);

        const lastBlock = await this.blockchainManagement.getLastBlock();

        const block = Block.create(
            lastBlock.index + 1,
            lastBlock.hash,
            uniqueTxs,
            this.privateKey
        );

        // Write to DB
        await this.blockchainManagement.addBlock(block);
        await mempool.clear();

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

        // for (const tx of txs) {
        //     if (this.transactionManagment.exists(tx.hash)) {
        //         return true;
        //     }
        // }
        return validTxs;
    }
}
