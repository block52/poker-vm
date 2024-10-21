import { Block } from "../models";
import { BlockchainManagement } from "../state/blockchainManagement";
import { ICommand } from "./interfaces";

export class BlockCommand implements ICommand<Block> {
  private readonly blockchainManagement: BlockchainManagement;
  private readonly index: BigInt | undefined;

  constructor(index: BigInt | undefined) {
    this.blockchainManagement = new BlockchainManagement();
    this.index = index;
  }

  public async execute(): Promise<Block> {
    if (this.index === BigInt(0)) {
      return this.blockchainManagement.getGenesisBlock();
    }
    if (this.index) {
      return await this.blockchainManagement.getBlock(Number(this.index));
    }
    return await this.blockchainManagement.getLastBlock();
  }
}
