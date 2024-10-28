import { getMempoolInstance, Mempool } from "../core/mempool";
import { Block } from "../models";

import { BlockchainManagement } from "../state/blockchainManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class MineCommand implements ISignedCommand<Block | null> {

    constructor(private readonly privateKey: string) { }

    public async execute(): Promise<ISignedResponse<Block | null>> {
        const mempool = getMempoolInstance();
        const txs = mempool.get();
        const blockchainManagement = new BlockchainManagement();
        const lastBlock = await blockchainManagement.getLastBlock();
        const block = Block.create(
            lastBlock.index + 1,
            lastBlock.hash,
            txs,
            this.privateKey
        );
        // Write to DB
        await blockchainManagement.addBlock(block);

        await mempool.clear();

        return signResult(block, this.privateKey);
    }
}
