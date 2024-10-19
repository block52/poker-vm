import { Block } from "../models/index";
import Blocks from "../schema/blocks";
import { ZeroAddress } from "ethers";

export class BlockchainManagement {
  constructor() {}

  public async addBlock(block: Block): Promise<void> {
    const newBlock = new Blocks({
      index: block.index,
      previous_block_hash: block.previousHash,
      timestamp: block.timestamp,
      validator: block.validator,
    });

    await newBlock.save();
  }

  public getGenesisBlock(): Block {
    return new Block(0, ZeroAddress, 0, ZeroAddress);
  }

  public async getLastBlock(): Promise<Block> {
    const lastBlock = await Blocks.findOne().sort({ index: -1 });
    if (!lastBlock) {
      return this.getGenesisBlock();
    }

    return new Block(
      lastBlock.index,
      lastBlock.previous_block_hash,
      lastBlock.timestamp,
      lastBlock.validator
    );
  }

  public async getBlock(index: number): Promise<Block> {
    const block = await Blocks.findOne({ index });
    if (!block) {
      throw new Error("Block not found");
    }

    return new Block(
      block.index,
      block.previous_block_hash,
      block.timestamp,
      block.validator
    );
  }
}
