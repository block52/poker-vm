import { Block } from "../models";
import { getBlockchainInstance } from "../state";
import { IBlockchainManagement } from "../state/interfaces";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class BlockHeightCommand implements ISignedCommand<Number> {
  private readonly blockchainManagement: IBlockchainManagement;

  constructor(private readonly privateKey: string) {
    this.blockchainManagement = getBlockchainInstance();
  }

  public async execute(): Promise<ISignedResponse<Number>> {
    const block: Block = await this.blockchainManagement.getLastBlock();
    return signResult(block.index, this.privateKey);
  }
}
