import { Level } from "level";
import { Block } from "../../models/block";
import * as path from "path";
import * as fs from "fs";
import { IBlockchainManagement } from "../interfaces";
import { ethers } from "ethers";

export class LevelDBBlockchainManagement implements IBlockchainManagement {
    private db: Level;
    private readonly prefix: string;
    private readonly dbPath: string;
    private initialized: boolean = false;

    /**
     * Constructor for LevelDBBlockchainManagement
     * @param dbPath Path to the LevelDB database
     * @param options LevelDB options
     * @param prefix Optional prefix for keys (useful for multiple blockchains)
     */
    constructor(dbPath: string, options: any = {}, prefix: string = "blockchain") {
        this.dbPath = dbPath;
        this.prefix = prefix;

        // Ensure directory exists
        const dirPath = path.dirname(dbPath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        this.db = new Level(dbPath, {
            valueEncoding: "json",
            ...options
        });
    }

    /**
     * Initialize the database and create genesis block if needed
     */
    public async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Open the database
            await this.db.open();

            // Check if we need to create the genesis block
            try {
                await this.getBlock(0);
            } catch (error) {
                await this.addBlock(this.getGenesisBlock());
            }

            this.initialized = true;
        } catch (error) {
            throw new Error(`Failed to initialize LevelDB: ${error}`);
        }
    }

    /**
     * Close the database connection
     */
    public async close(): Promise<void> {
        if (this.initialized) {
            await this.db.close();
            this.initialized = false;
        }
    }

    /**
     * Add a new block to the blockchain
     * @param block Block to add
     */
    public async addBlock(block: Block): Promise<void> {

        if (!this.initialized) {
            await this.initialize();
        }

        const batch = this.db.batch();

        // Store block by index
        batch.put(this.getIndexKey(block.index), JSON.stringify(block));

        // Store block by hash
        batch.put(this.getHashKey(block.hash), JSON.stringify(block));

        // Update the last block
        batch.put(this.getLastBlockKey(), JSON.stringify(block));

        // Update the block height
        const currentHeight = await this.getBlockHeight();
        if (block.index >= currentHeight) {
            // block.index += 1;
            batch.put(this.getHeightKey(), JSON.stringify(block));
        }

        await batch.write();

        // Close the database connection
        await this.db.close();
        // this.initialized = false;
    }

    /**
     * Get the genesis block (first block in the chain)
     */
    public getGenesisBlock(): Block {
        // Define genesis block structure
        const genesisBlock: Block = new Block(
            0,
            ethers.ZeroHash,
            new Date("2023-01-01T00:00:00Z").getTime(),
            ethers.ZeroAddress,
            ethers.ZeroHash,
            ethers.ZeroHash,
            ethers.ZeroHash,
            [] // No transactions in the genesis block
        );

        return genesisBlock;
    }

    /**
     * Get the current height of the blockchain
     */
    public async getBlockHeight(): Promise<number> {
        try {
            // const height = await this.db.get(this.getHeightKey());
            // return height;
            return 0;
        } catch (error) {
            // If height key doesn't exist, return 0
            return 0;
        }
    }

    /**
     * Get the last block in the blockchain
     */
    public async getLastBlock(): Promise<Block> {
        try {
            const block = await this.db.get(this.getLastBlockKey());
            return Block.fromJson(JSON.parse(block));
        } catch (error) {
            // If last block doesn't exist, return genesis block
            return this.getGenesisBlock();
        }
    }

    /**
     * Get a block by its hash
     * @param hash Block hash
     */
    public async getBlockByHash(hash: string): Promise<Block | null> {
        try {
            const block = await this.db.get(this.getHashKey(hash));
            return Block.fromJson(JSON.parse(block));
        } catch (error) {
            return null;
        }
    }

    /**
     * Get a block by its index
     * @param index Block index
     */
    public async getBlockByIndex(index: number): Promise<Block | null> {
        try {
            const block = await this.db.get(this.getIndexKey(index));
            return Block.fromJson(JSON.parse(block));
        } catch (error) {
            return null;
        }
    }

    /**
     * Get a block by its index (throws error if not found)
     * @param index Block index
     */
    public async getBlock(index: number): Promise<Block> {
        const block = await this.getBlockByIndex(index);

        if (!block) {
            throw new Error(`Block with index ${index} not found`);
        }

        return block;
    }

    /**
     * Get multiple blocks from the blockchain
     * @param count Optional number of blocks to retrieve (defaults to all)
     */
    public async getBlocks(count?: number): Promise<Block[]> {
        const blockHeight = await this.getBlockHeight();
        const end = count ? Math.min(blockHeight, count) : blockHeight;
        const blocks: Block[] = [];

        // Use a more efficient approach with LevelDB's iterator
        return new Promise((resolve, reject) => {
            const blocks: Block[] = [];
            let counter = 0;

            const iterator = this.db.iterator({
                gte: this.getIndexKey(0),
                lte: this.getIndexKey(end - 1),
                limit: end,
                values: true
            });

            // const iterate = () => {
            //     iterator.next((err, key, value) => {
            //         if (err) {
            //             iterator.end(err => {
            //                 if (err) return reject(err);
            //                 reject(err);
            //             });
            //             return;
            //         }

            //         if (key === undefined && value === undefined) {
            //             iterator.end(err => {
            //                 if (err) return reject(err);
            //                 resolve(blocks);
            //             });
            //             return;
            //         }

            //         blocks.push(value);
            //         counter++;

            //         if (count && counter >= count) {
            //             iterator.end(err => {
            //                 if (err) return reject(err);
            //                 resolve(blocks);
            //             });
            //             return;
            //         }

            //         iterate();
            //     });
            // };

            //iterate();
        });
    }

    /**
     * Reset the blockchain (remove all blocks)
     */
    public async reset(): Promise<void> {
        // Close the existing database
        if (this.initialized) {
            await this.db.close();
            this.initialized = false;
        }

        // Use LevelDB's destroy function to completely remove the database
        await this.db.clear();

        // Create a new database instance
        this.db = new Level(this.dbPath, { valueEncoding: "json" });
        await this.db.open();
        this.initialized = true;

        // Add genesis block
        await this.addBlock(this.getGenesisBlock());
    }

    // Helper methods for key generation
    private getIndexKey(index: number): string {
        return `${this.prefix}:index:${index}`;
    }

    private getHashKey(hash: string): string {
        return `${this.prefix}:hash:${hash}`;
    }

    private getHeightKey(): string {
        return `${this.prefix}:height`;
    }

    private getLastBlockKey(): string {
        return `${this.prefix}:lastBlock`;
    }
}
