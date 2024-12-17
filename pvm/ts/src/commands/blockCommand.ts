import { Block } from "../models";
import { BlockchainManagement } from "../state/blockchainManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export type BlockCommandParams = {
  index?: BigInt;
  hash?: string;
};

export class BlockCommand implements ISignedCommand<Block> {
  private readonly blockchainManagement: BlockchainManagement;
  private readonly params: BlockCommandParams;

  constructor(params: BlockCommandParams, private readonly privateKey: string) {
    this.blockchainManagement = new BlockchainManagement();
    this.params = params;
  }

  public async execute(): Promise<ISignedResponse<Block>> {
    // TODO: REGEX to validate hash
    if (this.params.hash) {
      const block: Block = await this.blockchainManagement.getBlockByHash(this.params.hash);
      return signResult(block, this.privateKey);
    }

    if (!this.params.index) {
      return signResult(await this.blockchainManagement.getLastBlock(), this.privateKey);
    }

    if (this.params.index === BigInt(0)) {
      return signResult(await this.blockchainManagement.getGenesisBlock(), this.privateKey);
    }

    if (this.params.index) {
      const block: Block = await this.blockchainManagement.getBlock(Number(this.params.index));
      return signResult(block, this.privateKey);
    }

    return signResult(await this.blockchainManagement.getLastBlock(), this.privateKey);
  }
}
