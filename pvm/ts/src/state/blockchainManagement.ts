import { Block, Transaction } from "../models/index";
import Blocks from "../schema/blocks";
import { StateManager } from "./stateManager";
import GenesisBlock from "../data/genesisblock.json";
import { IBlockDocument } from "../models/interfaces";
import { AccountManagement } from "./accountManagement";
import { TransactionManagement } from "./transactionManagement";
import { getTransactionInstance } from "./transactionManagement";

export class BlockchainManagement extends StateManager {
    constructor() {
        super(process.env.DB_URL || "mongodb://localhost:27017/pvm");
    }

    public async addBlock(block: Block): Promise<void> {
        await this.connect();

        // Check if block already exists
        const existingBlock = await Blocks.findOne({ hash: block.hash });
        if (existingBlock) {
            console.log(`Block already exists: ${block.hash}`);
            return;
        }

        // First update account balances if there are transactions
        if (block.transactions && block.transactions.length > 0) {
            const accountManagement = new AccountManagement();
            await accountManagement.applyTransactions(block.transactions);

            // Add transactions to transaction management
            const transactionManagement = new TransactionManagement();
            await transactionManagement.addTransactions(block.transactions, block.hash);
        }

        // Save the block with transaction hashes
        const blockDoc = block.toDocument();
        const newBlock = new Blocks(blockDoc);
        await newBlock.save();

        console.log(`Block saved with ${block.transactions.length} transactions`);
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

    public async getBlockHeader(index: number): Promise<Block> {
        await this.connect();
        const block = await Blocks.findOne({ index });
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

    public async getBlocks(count?: number): Promise<Block[]> {
        await this.connect();
        const blocks = await Blocks.find({})
            .sort({ timestamp: -1 })
            .limit(count ?? 20);

        // Get transaction management instance
        const transactionManagement = getTransactionInstance();

        // Convert to Block objects and load transaction counts
        const blockObjects = await Promise.all(blocks.map(async blockDoc => {
            const block = Block.fromDocument(blockDoc);
            const transactions = await transactionManagement.getTransactions(block.hash);
            block.transactionCount = transactions.length;
            return block;
        }));

        return blockObjects;
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
};
