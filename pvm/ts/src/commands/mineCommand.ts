import { getMempoolInstance, Mempool } from "../core/mempool";
import { Block, Transaction } from "../models";

import { getBlockchainInstance } from "../state/blockchainManagement";
import { getTransactionInstance } from "../state/transactionManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class MineCommand implements ISignedCommand<Block | null> {
    private readonly mempool: Mempool;
    private readonly blockchainManagement;
    private readonly transactionManagment;

    constructor(private readonly privateKey: string) {
        this.mempool = getMempoolInstance();
        this.blockchainManagement = getBlockchainInstance();
        this.transactionManagment = getTransactionInstance();
     }

    public async execute(): Promise<ISignedResponse<Block | null>> {
        const txs: Transaction[] = this.mempool.get();
        const lastBlock = await this.blockchainManagement.getLastBlock();

        for (const tx of txs) {
            const exists = await this.transactionManagment.exists(tx.hash);
            if (exists) {
                // Remove from mempool
                txs.splice(txs.indexOf(tx), 1);
            }
        }
        
        const block = Block.create(
            lastBlock.index + 1,
            lastBlock.hash,
            txs,
            this.privateKey
        );
        
        // Write to DB
        await this.blockchainManagement.addBlock(block);
        await this.mempool.clear();

        return signResult(block, this.privateKey);
    }
}
