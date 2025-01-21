import { BlockDTO, NodeRpcClient } from "@bitcoinbrisbane/block52";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { BlockchainManagement, getBlockchainInstance } from "../state/blockchainManagement";
import { Block } from "../models";

export class ReceiveMinedBlockHashCommand implements ISignedCommand<string> {
    private readonly blockchainManagement: BlockchainManagement;

    constructor(
        private readonly blockHash: string,
        private readonly nodeUrl: string,
        private readonly privateKey: string
    ) {
        this.blockchainManagement = getBlockchainInstance();
    }

    public async execute(): Promise<ISignedResponse<string>> {
        console.log(`Received mined block hash: ${this.blockHash}`);
        console.log(`Downloading block from URL: ${this.nodeUrl}`);

        // Download the block from the URL
        const client = new NodeRpcClient(this.nodeUrl, this.privateKey);
        const blockDTO: BlockDTO = await client.getBlockByHash(this.blockHash);

        if (!blockDTO) {
            throw new Error(`Block not found: ${this.blockHash}`);
        }

        const block: Block = Block.fromJson(blockDTO);

        console.log(`Block: ${JSON.stringify(block)}`);
        await this.blockchainManagement.addBlock(block);

        return signResult(this.blockHash, this.privateKey);
    }
}
