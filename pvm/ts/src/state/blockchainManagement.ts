import { Block } from "../models/index";
import Blocks from "../schema/blocks";
import { StateManager } from "./stateManager";

import GenesisBlock from "../data/genesisblock.json";
import { IBlockDocument } from "../models/interfaces";

export class BlockchainManagement extends StateManager {
  constructor() {
    super(process.env.MONGO_URI || "mongodb://localhost:27017/pvm");
  }

  public async addBlock(block: Block): Promise<void> {
    await this.connect();

    const newBlock = new Blocks(block.toDocument());
    await newBlock.save();
  }

  public getGenesisBlock(): Block {
    return Block.fromJson(GenesisBlock);
  }

  public async getLastBlock(): Promise<Block> {
    await this.connect();

    const lastBlock: IBlockDocument | null = await Blocks.findOne().sort({ index: -1 });
    if (!lastBlock) {
      return this.getGenesisBlock();
    }
    return Block.fromDocument(lastBlock);
  }

  public async getBlock(index: number): Promise<Block> {
    const block = await Blocks.findOne({ index });
    if (!block) {
      throw new Error("Block not found");
    }
    return Block.fromDocument(block);
  }
}
