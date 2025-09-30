/**
 * Example utility demonstrating how to use GetCosmosBlocksCommand
 * This shows integration with environment variables and error handling
 */

import { GetCosmosBlocksCommand, CosmosBlockInfo } from "../commands/getCosmosBlocksCommand";

export class CosmosBlockService {
    private readonly rpcUrl: string;
    private readonly privateKey: string;

    constructor(privateKey: string, rpcUrl?: string) {
        this.privateKey = privateKey;
        this.rpcUrl = rpcUrl || process.env.COSMOS_RPC_ENDPOINT || "http://localhost:26657";
    }

    /**
     * Get latest blocks from Cosmos chain
     */
    async getLatestBlocks(count: number = 10): Promise<CosmosBlockInfo[]> {
        const command = new GetCosmosBlocksCommand(this.rpcUrl, this.privateKey, count);
        const result = await command.execute();
        return result.data;
    }

    /**
     * Get blocks starting from a specific height
     */
    async getBlocksFromHeight(startHeight: number, count: number = 10): Promise<CosmosBlockInfo[]> {
        const command = new GetCosmosBlocksCommand(this.rpcUrl, this.privateKey, count, startHeight);
        const result = await command.execute();
        return result.data;
    }

    /**
     * Get block information with additional metadata
     */
    async getBlocksWithMetadata(count: number = 10) {
        const blocks = await this.getLatestBlocks(count);

        return blocks.map(block => ({
            ...block,
            formattedTime: new Date(block.time).toLocaleString(),
            shortHash: block.hash.substring(0, 16) + "...",
            avgTxPerBlock: blocks.reduce((sum, b) => sum + b.txCount, 0) / blocks.length
        }));
    }

    /**
     * Find blocks with transactions
     */
    async getBlocksWithTransactions(count: number = 50): Promise<CosmosBlockInfo[]> {
        const blocks = await this.getLatestBlocks(count);
        return blocks.filter(block => block.txCount > 0);
    }
}

// Example usage:
/*
const privateKey = "0x...";
const cosmosService = new CosmosBlockService(privateKey);

// Get latest 20 blocks
const latestBlocks = await cosmosService.getLatestBlocks(20);
console.log("Latest blocks:", latestBlocks);

// Get blocks from height 1000
const historicalBlocks = await cosmosService.getBlocksFromHeight(1000, 5);
console.log("Historical blocks:", historicalBlocks);

// Get blocks with metadata
const blocksWithMeta = await cosmosService.getBlocksWithMetadata(10);
console.log("Blocks with metadata:", blocksWithMeta);
*/