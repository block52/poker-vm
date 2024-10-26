import { Block } from "../models";
import { BlockchainManagement } from "../state/blockchainManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class BlockCommand implements ISignedCommand<Block> {
  private readonly blockchainManagement: BlockchainManagement;
  private readonly index: BigInt | undefined;

  constructor(index: BigInt | undefined, private readonly privateKey: string) {

    this.blockchainManagement = new BlockchainManagement();
    this.index = index;
  }

  public async execute(): Promise<ISignedResponse<Block>> {
    if (this.index === BigInt(0)) {
      return signResult(await this.blockchainManagement.getGenesisBlock(), this.privateKey);
    }
    if (this.index) {
      return signResult(await this.blockchainManagement.getBlock(Number(this.index)), this.privateKey);
    }
    return signResult(await this.blockchainManagement.getLastBlock(), this.privateKey);
  }
}
