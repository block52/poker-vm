import { Block } from "../../models/index";
import Blocks from "../../schema/blocks";
import { StateManager } from "../stateManager";
import GenesisBlock from "../../data/genesisblock.json";
import { IBlockDocument } from "../../models/interfaces";
import { AccountManagement } from "./accountManagement";
import { getTransactionInstance } from "../../state/index";
import { IBlockchainManagement, ITransactionManagement } from "../interfaces";

export class MongoDBBlockchainManagement extends StateManager implements IBlockchainManagement {

    private readonly transactionManagement: ITransactionManagement;

    constructor(protected readonly connString: string) {
        super(connString);
        this.transactionManagement = getTransactionInstance();
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
            const accountManagement = new AccountManagement(this.connString);
            await accountManagement.applyTransactions(block.transactions);

            // Add transactions to transaction management
            await this.transactionManagement.addTransactions(block.transactions, block.hash);
        }

        // Save the block with transaction hashes
        const blockDoc = block.toDocument();
        const newBlock = new Blocks(blockDoc);
        await newBlock.save();
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

    public getBlockByIndex(index: number): Promise<Block | null> {
        return this.getBlock(index).catch(() => null);
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

        return blocks.map(block => Block.fromDocument(block));
    }

    public async reset(): Promise<void> {
        await this.connect();
        await Blocks.deleteMany({});
    }
}

