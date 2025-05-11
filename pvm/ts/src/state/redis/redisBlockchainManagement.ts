import { Redis } from "ioredis";
import { Block } from "../../models/block";
import { IBlockchainManagement } from "../interfaces";
import { ethers } from "ethers";

export class RedisBlockchainManagement implements IBlockchainManagement {
    private readonly redisClient: Redis;
    private readonly blockchainKey: string;
    private readonly blockIndexKey: string;
    private readonly blockHashKey: string;
    private readonly lastBlockKey: string;

    /**
     * Constructor for RedisBlockchainManagement
     * @param redisClient Redis client instance
     * @param namespace Optional namespace for Redis keys (useful for multiple blockchains)
     */
    constructor(redisClient: Redis, namespace: string = "blockchain") {
        this.redisClient = redisClient;
        this.blockchainKey = `${namespace}:blocks`;
        this.blockIndexKey = `${namespace}:block:index`;
        this.blockHashKey = `${namespace}:block:hash`;
        this.lastBlockKey = `${namespace}:lastBlock`;
    }

    /**
     * Add a new block to the blockchain
     * @param block Block to add
     */
    public async addBlock(block: Block): Promise<void> {
        const multi = this.redisClient.multi();

        // Store block by index
        multi.hset(this.blockIndexKey, block.index.toString(), JSON.stringify(block));

        // Store block by hash
        multi.hset(this.blockHashKey, block.hash, JSON.stringify(block));

        // Update the last block
        multi.set(this.lastBlockKey, JSON.stringify(block));

        // Add to the blockchain list
        multi.rpush(this.blockchainKey, JSON.stringify(block));

        await multi.exec();
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
        const length = await this.redisClient.llen(this.blockchainKey);
        return length;
    }

    /**
     * Get the last block in the blockchain
     */
    public async getLastBlock(): Promise<Block> {
        const lastBlockString = await this.redisClient.get(this.lastBlockKey);

        if (!lastBlockString) {
            return this.getGenesisBlock();
        }

        return JSON.parse(lastBlockString) as Block;
    }

    /**
     * Get a block by its hash
     * @param hash Block hash
     */
    public async getBlockByHash(hash: string): Promise<Block | null> {
        const blockString = await this.redisClient.hget(this.blockHashKey, hash);

        if (!blockString) {
            return null;
        }

        return JSON.parse(blockString) as Block;
    }

    /**
     * Get a block by its index
     * @param index Block index
     */
    public async getBlockByIndex(index: number): Promise<Block | null> {
        const blockString = await this.redisClient.hget(this.blockIndexKey, index.toString());

        if (!blockString) {
            return null;
        }

        return JSON.parse(blockString) as Block;
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
        const end = count ? Math.min(blockHeight - 1, count - 1) : blockHeight - 1;

        const blockStrings = await this.redisClient.lrange(this.blockchainKey, 0, end);

        return blockStrings.map(blockString => JSON.parse(blockString) as Block);
    }

    /**
     * Reset the blockchain (remove all blocks)
     */
    public async reset(): Promise<void> {
        const multi = this.redisClient.multi();

        multi.del(this.blockchainKey);
        multi.del(this.blockIndexKey);
        multi.del(this.blockHashKey);
        multi.del(this.lastBlockKey);

        await multi.exec();
    }

    /**
     * Initialize the blockchain with the genesis block if it doesn't exist
     */
    public async initialize(): Promise<void> {
        const blockHeight = await this.getBlockHeight();

        if (blockHeight === 0) {
            await this.addBlock(this.getGenesisBlock());
        }
    }
}
