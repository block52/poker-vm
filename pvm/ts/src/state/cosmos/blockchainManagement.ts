import { IBlockchainManagement } from "../interfaces";
import { Block } from "../../models";

/**
 * Cosmos-based Blockchain Management
 * Uses Cosmos SDK for blockchain state management
 */
export class CosmosBlockchainManagement implements IBlockchainManagement {
    private blocks: Map<string, Block> = new Map();
    private blocksByIndex: Map<number, Block> = new Map();

    /**
     * Add a block
     */
    public async addBlock(block: Block): Promise<void> {
        try {
            this.blocks.set(block.hash, block);
            this.blocksByIndex.set(block.index, block);

            console.log(`Added block ${block.hash} at index ${block.index}`);
        } catch (error) {
            console.error("Error adding block:", error);
            throw error;
        }
    }

    /**
     * Get genesis block
     */
    public getGenesisBlock(): Block {
        const genesisBlock = this.blocksByIndex.get(0);
        if (!genesisBlock) {
            throw new Error("Genesis block not found");
        }
        return genesisBlock;
    }

    /**
     * Get current blockchain height
     */
    public async getBlockHeight(): Promise<number> {
        const indices = Array.from(this.blocksByIndex.keys());
        return indices.length > 0 ? Math.max(...indices) : 0;
    }

    /**
     * Get latest block
     */
    public async getLastBlock(): Promise<Block> {
        const height = await this.getBlockHeight();
        const lastBlock = this.blocksByIndex.get(height);
        if (!lastBlock) {
            throw new Error("No blocks found");
        }
        return lastBlock;
    }

    /**
     * Get block by hash
     */
    public async getBlockByHash(hash: string): Promise<Block | null> {
        return this.blocks.get(hash) || null;
    }

    /**
     * Get block by index
     */
    public async getBlockByIndex(index: number): Promise<Block | null> {
        return this.blocksByIndex.get(index) || null;
    }

    /**
     * Get block by index (required by interface)
     */
    public async getBlock(index: number): Promise<Block> {
        const block = this.blocksByIndex.get(index);
        if (!block) {
            throw new Error(`Block not found at index ${index}`);
        }
        return block;
    }

    /**
     * Get blocks
     */
    public async getBlocks(count?: number): Promise<Block[]> {
        const blocks = Array.from(this.blocks.values()).sort((a, b) => a.index - b.index);

        if (count && count > 0) {
            return blocks.slice(-count); // Return last N blocks
        }

        return blocks;
    }

    /**
     * Reset blockchain state
     */
    public async reset(): Promise<void> {
        this.blocks.clear();
        this.blocksByIndex.clear();
        console.log("Reset blockchain state");
    }

    /**
     * Get blocks in range
     */
    public async getBlocksInRange(startIndex: number, endIndex: number): Promise<Block[]> {
        const blocks: Block[] = [];

        for (let index = startIndex; index <= endIndex; index++) {
            const block = await this.getBlockByIndex(index);
            if (block) {
                blocks.push(block);
            }
        }

        return blocks;
    }

    /**
     * Validate a block
     */
    public async validateBlock(block: Block): Promise<boolean> {
        try {
            // Basic validation
            if (!block.hash || !block.previousHash || block.index < 0) {
                return false;
            }

            // Check if previous block exists (except for genesis)
            if (block.index > 0) {
                const previousBlock = await this.getBlockByIndex(block.index - 1);
                if (!previousBlock || previousBlock.hash !== block.previousHash) {
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error("Error validating block:", error);
            return false;
        }
    }

    /**
     * Get block count
     */
    public async getBlockCount(): Promise<number> {
        return this.blocks.size;
    }

    /**
     * Search blocks by criteria
     */
    public async searchBlocks(criteria: {
        validator?: string;
        timestampFrom?: number;
        timestampTo?: number;
        limit?: number;
    }): Promise<Block[]> {
        let blocks = Array.from(this.blocks.values());

        // Apply filters
        if (criteria.validator) {
            blocks = blocks.filter(block => block.validator === criteria.validator);
        }

        if (criteria.timestampFrom) {
            blocks = blocks.filter(block => block.timestamp >= criteria.timestampFrom!);
        }

        if (criteria.timestampTo) {
            blocks = blocks.filter(block => block.timestamp <= criteria.timestampTo!);
        }

        // Sort by index (newest first)
        blocks.sort((a, b) => b.index - a.index);

        // Apply limit
        if (criteria.limit && criteria.limit > 0) {
            blocks = blocks.slice(0, criteria.limit);
        }

        return blocks;
    }

    /**
     * Clear cached blocks (for testing)
     */
    public async clearBlocks(): Promise<void> {
        this.blocks.clear();
        this.blocksByIndex.clear();
        console.log("Cleared all cached blocks");
    }
}

// Singleton instance
let cosmosBlockchainInstance: CosmosBlockchainManagement | null = null;

export const getCosmosBlockchainManagementInstance = (): IBlockchainManagement => {
    if (!cosmosBlockchainInstance) {
        cosmosBlockchainInstance = new CosmosBlockchainManagement();
    }
    return cosmosBlockchainInstance;
};