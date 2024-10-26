import { ZeroHash } from "ethers";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { Block } from "../models";

import { ICommand } from "./interfaces";
import { BlockchainManagement } from "../state/blockchainManagement";
import { AbstractCommand } from "./abstractSignedCommand";

export class MineCommand extends AbstractCommand<Block | null> {
    private readonly mempool: Mempool;

    constructor(privateKey: string) {
        super(privateKey);
        this.mempool = getMempoolInstance();
    }

    public async executeCommand(): Promise<Block> {
        const txs = this.mempool.get();
        const blockchainManagement = new BlockchainManagement();
        const lastBlock = await blockchainManagement.getLastBlock();
        const block = Block.create(lastBlock.index + 1, lastBlock.hash, txs, this.privateKey);
        this.mempool.clear();
        
        return block;
    }
}
