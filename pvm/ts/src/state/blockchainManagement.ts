import { Block, Transaction } from "../models/index";
import Blocks from "../schema/blocks";
import { StateManager } from "./stateManager";
import GenesisBlock from "../data/genesisblock.json";
import { IBlockDocument } from "../models/interfaces";
import { BlockList } from "../models/blockList";
import { AccountManagement } from "./accountManagement";
import { TransactionManagement } from "./transactionManagement";
import TexasHoldemGame from "../engine/texasHoldem";
import GameManagement from "./gameManagement";
import { PlayerActionType } from "@bitcoinbrisbane/block52";

export class BlockchainManagement extends StateManager {
    constructor() {
        super(process.env.DB_URL || "mongodb://localhost:27017/pvm");
    }

    public async addBlock(block: Block): Promise<void> {
        await this.connect();

        // Check to see if the block already exists
        const existingBlock = await Blocks.findOne({ hash: block.hash });
        if (existingBlock) {
            console.log(`Block already exists: ${block.hash}`);
            return;
        }

        // todo add block hash to each transaction
        // // Validate transactions
        const transactionManagement = new TransactionManagement();
        await transactionManagement.addTransactions(block.transactions);


        // // Get the game state as JSON from the chain
        // const json = await this.gameManagement.get(this.address);
        // const game = TexasHoldemGame.fromJson(json);

        // // Get all transactions from the chain
        // const minedTransactions = await this.transactionManagement.getTransactionsByAddress(this.address);
        // console.log(`Mined transactions: ${minedTransactions.length}`);

        // // Get all transactions from mempool and replay them
        // const mempoolTransactions = this.mempool.findAll(tx => tx.to === this.address);
        // console.log(`Mempool transactions: ${mempoolTransactions.length}`);
        // // Merge transactions
        // const allTransactions = [...minedTransactions, ...mempoolTransactions];

        const gameManagement = new GameManagement();

        block.transactions.forEach(tx => {    
            const json = gameManagement.get(tx.to);

            if (!json) {
                return;
            }

            const game = TexasHoldemGame.fromJson(json);

            switch (tx.data) {
                case "join":
                    // const player = new Player(tx.from, Number(tx.value));
                    game.join2(tx.from, tx.value);
                    break;
                case "bet":
                    game.performAction(tx.from, PlayerActionType.BET, tx.value);
                    break;
                case "call":
                    game.performAction(tx.from, PlayerActionType.CALL, tx.value);
                    break;
                case "fold":
                    game.performAction(tx.from, PlayerActionType.FOLD, 0n);
                    break;
                case "check":
                    game.performAction(tx.from, PlayerActionType.CHECK, 0n);
                    break;
                case "raise":
                    game.performAction(tx.from, PlayerActionType.RAISE, tx.value);
                    break;
                default:
                    throw new Error("Invalid action");
            };
        });

        // const state = game.state;




        // // Write to DB in parallel
        // await Promise.all([
        //     this.blockchainManagement.addBlock(block),
        //     this.transactionManagement.addTransactions(uniqueTxs),
        // ]);

        // Update the account balances
        if (block.transactions) {
            const accountManagement = new AccountManagement();
            await accountManagement.applyTransactions(block.transactions);
        }

        // Save the block document to the database
        const newBlock = new Blocks(block.toDocument());
        await newBlock.save();

        // if (block.transactions) {

        //   // // add block hash to each transaction
        //   // block.transactions.forEach(tx => {
        //   //   tx.blockHash = block.hash;
        //   // });

        //   // Save transactions
        //   const transactionManagement = new TransactionManagement();
        //   await transactionManagement.addTransactions(block.transactions);
        // }
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
};
