import { Block } from "../models";
import { BlockchainManagement } from "../state/blockchainManagment";
import { ICommand } from "./interfaces";

export class BlockCommand implements ICommand<Block> {
  private readonly blockchainManagement: BlockchainManagement;

  constructor() {
    this.blockchainManagement = new BlockchainManagement();
  }

  public async execute(): Promise<Block> {
    const lastBlock = await this.blockchainManagement.getLastBlock();

    return lastBlock;
  }
}
