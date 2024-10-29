
import { Block } from "../models/block";
import { BlockList } from "../models/blockList";
import { BlockchainManagement } from "../state/blockchainManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class GetBlocksCommand implements ISignedCommand<BlockList> {
    private readonly blockchainManagement: BlockchainManagement;

    constructor(
        private readonly count: number = 100,
        private readonly privateKey: string
    ) {
        this.blockchainManagement = new BlockchainManagement();
    }

    public async execute(): Promise<ISignedResponse<BlockList>> {
        const blockList: BlockList = await this.blockchainManagement.getBlocks(this.count);
        return signResult(blockList, this.privateKey);
    }
}   