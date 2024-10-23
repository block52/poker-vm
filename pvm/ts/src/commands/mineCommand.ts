import { ZeroHash } from "ethers";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { Block } from "../models";

import { ICommand } from "./interfaces";
import { BlockchainManagement } from "../state/blockchainManagement";

export class MineCommand implements ICommand<Block | null> {
    private readonly mempool: Mempool;

    constructor(private readonly privateKey: string) {
        if (!privateKey) {
            throw new Error("Private key is required to mine a block");
        }
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<Block> {
        const txs = this.mempool.get();
        const blockchainManagement = new BlockchainManagement();
        const lastBlock = await blockchainManagement.getLastBlock();
        const block = Block.create(lastBlock.index + 1, lastBlock.hash, txs, this.privateKey);
        this.mempool.clear();
        
        return block;
    }
}
