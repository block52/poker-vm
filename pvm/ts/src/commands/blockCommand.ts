import { Block } from "../models";
import { BlockchainManagement } from "../state/blockchainManagement";
import { AbstractCommand } from "./abstractSignedCommand";

export class BlockCommand extends AbstractCommand<Block> {
  private readonly blockchainManagement: BlockchainManagement;
  private readonly index: BigInt | undefined;

  constructor(index: BigInt | undefined, privateKey: string) {
    super(privateKey);
    this.blockchainManagement = new BlockchainManagement();
    this.index = index;
  }

  public async executeCommand(): Promise<Block> {
    if (this.index === BigInt(0)) {
      return this.blockchainManagement.getGenesisBlock();
    }
    if (this.index) {
      return await this.blockchainManagement.getBlock(Number(this.index));
    }
    return await this.blockchainManagement.getLastBlock();
  }
}
