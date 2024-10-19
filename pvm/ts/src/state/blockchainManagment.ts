import { Block } from "../models/index";
import { Blocks } from "../schema/blocks";
import { ZeroAddress } from "ethers";

// create blocks here too, with last index
export class BlockchainManagement {
  constructor() {}

  public getGenesisBlock(): Block {
    return new Block(0, ZeroAddress, 0, ZeroAddress);
  }

  public async createNexBlock(
    index: number,
    previousHash: string,
    timestamp: number,
    data: string
  ): Promise<void> {
    // const block = new Block(index, previousHash, timestamp, data, hash);
    // this.blocks.push(block);
    // return block;
  }

  public async getBlock(index: number): Promise<Block> {
    // return this.blocks[index];
  }
}
