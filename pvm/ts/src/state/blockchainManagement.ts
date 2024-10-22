import { Block } from "../models/index";
import Blocks from "../schema/blocks";
import { ZeroAddress } from "ethers";
import { StateManager } from "./stateManager";

import GenesisBlock from "../data/genesisblock.json";

export class BlockchainManagement extends StateManager {
  constructor() {
    super(process.env.MONGO_URI || "mongodb://localhost:27017/pvm");
  }

  public async addBlock(block: Block): Promise<void> {
    await this.connect();

    const newBlock = new Blocks({
      index: block.index,
      previous_block_hash: block.previousHash,
      timestamp: block.timestamp,
      validator: block.validator,
    });

    await newBlock.save();
  }

  public getGenesisBlock(): Block {
    return Block.fromJson(GenesisBlock);
  }

  public async getLastBlock(): Promise<Block> {
    await this.connect();

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
