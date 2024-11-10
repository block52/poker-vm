import { Block, Transaction } from "../models/index";
import Blocks from "../schema/blocks";
import { StateManager } from "./stateManager";

import GenesisBlock from "../data/genesisblock.json";
import { IBlockDocument } from "../models/interfaces";
import { TransactionList } from "../models/transactionList";
import { BlockList } from "../models/blockList";
import AccountManagement from "./accountManagement";

export class BlockchainManagement extends StateManager {
  constructor() {
    super(process.env.DB_URL || "mongodb://localhost:27017/pvm");
  }

  public async addBlock(block: Block): Promise<void> {
    await this.connect();
    // Update the account balances
    const accountManagement = new AccountManagement();
    await accountManagement.applyTransactions(block.transactions);
  
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
    await this.connect();
    const block = await Blocks.findOne({ index });
    if (!block) {
      throw new Error("Block not found");
    }
    return Block.fromDocument(block);
  }

  public async getBlocks(count?: number): Promise<BlockList> {
    await this.connect();
    const blocks = await Blocks.find({})
        .sort({ timestamp: -1 })
        .limit(count ?? 20);

    return new BlockList(blocks.map(block => Block.fromDocument(block)));

  }

  public async getTransactions(count?: number): Promise<TransactionList> {
    await this.connect();
    const blocks = await Blocks.find({}, { transactions: 1 })
        .sort({ timestamp: -1 })
        .limit(count ?? 100);
        
    const transactions: Transaction[] = blocks
        .flatMap(block => block.transactions || [])
        .map(tx => Transaction.fromDocument(tx));

    return new TransactionList(transactions);
  }
}
