import { Block, Transaction } from "../models/index";
import Blocks from "../schema/blocks";
import { StateManager } from "./stateManager";
import GenesisBlock from "../data/genesisblock.json";
import { IBlockDocument } from "../models/interfaces";
import { TransactionList } from "../models/transactionList";
import { BlockList } from "../models/blockList";
import AccountManagement from "./accountManagement";
import { TransactionManagement } from "./transactionManagement";

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

    if (block.transactions) {

      // add block hash to each transaction
      block.transactions.forEach(tx => {
        tx.blockHash = block.hash;
      });

      // Save transactions
      const transactionManagement = new TransactionManagement();
      await transactionManagement.addTransactions(block.transactions);
    }
  }

  public getGenesisBlock(): Block {
    return Block.fromJson(GenesisBlock);
  }

  public async getBlockHeight(): Promise<number> {
    await this.connect();
    const lastBlock: IBlockDocument | null = await Blocks.findOne().sort({ index: -1 });
    if (!lastBlock) {
      return 0;
    }
    return lastBlock.index;
  }

  public async getLastBlock(): Promise<Block> {
    await this.connect();

    const lastBlock: IBlockDocument | null = await Blocks.findOne().sort({ index: -1 });
    if (!lastBlock) {
      return this.getGenesisBlock();
    }
    return Block.fromDocument(lastBlock);
  }

  public async getBlockByHash(hash: string): Promise<Block> {
    await this.connect();
    const block = await Blocks.findOne({ hash });
    if (!block) {
      throw new Error("Block not found");
    }
    return Block.fromDocument(block);
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

  public async reset(): Promise<void> {
    await this.connect();
    await Blocks.deleteMany({});
  }
}

let instance: BlockchainManagement;
export const getBlockchainInstance = (): BlockchainManagement => {
  if (!instance) {
    instance = new BlockchainManagement();
  }
  return instance;
}