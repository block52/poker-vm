import { Block } from "../models";
import { BlockchainManagement } from "../state/blockchainManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class BlockHeightCommand implements ISignedCommand<Number> {
  private readonly blockchainManagement: BlockchainManagement;

  constructor(private readonly privateKey: string) {
    this.blockchainManagement = new BlockchainManagement();
  }

  public async execute(): Promise<ISignedResponse<Number>> {
    const block: Block = await this.blockchainManagement.getLastBlock();
    return signResult(block.index, this.privateKey);
  }
}