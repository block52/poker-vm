import { BlockDTO, NodeRpcClient } from "@bitcoinbrisbane/block52";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { getBlockchainInstance } from "../state/blockchainManagement";
import { Block } from "../models";
import { IBlockchainManagement } from "../state/interfaces";

export class ReceiveMinedBlockCommand implements ISignedCommand<string> {
    private readonly blockchainManagement: IBlockchainManagement;

    constructor(
        private readonly blockHash: string,
        private readonly blockDTO: BlockDTO,
        private readonly privateKey: string
    ) {
        this.blockchainManagement = getBlockchainInstance();
    }

    public async execute(): Promise<ISignedResponse<string>> {
        // console.log(`Received mined block hash: ${this.blockHash}`);

        if (await this.blockchainManagement.getBlockByHash(this.blockHash)) {
            console.log(`Block already in blockchain: ${this.blockHash}`);
            return signResult(this.blockHash, this.privateKey);
        }

        const block: Block = Block.fromJson(this.blockDTO);
        // console.log(`Block: ${JSON.stringify(block)}`);
        await this.blockchainManagement.addBlock(block);

        return signResult(this.blockHash, this.privateKey);
    }
}
