/**
 * GetCosmosBlocksCommand - Fetches blocks from a Cosmos SDK blockchain via RPC
 *
 * Usage examples:
 *
 * // Fetch latest 10 blocks
 * const command = new GetCosmosBlocksCommand("http://localhost:26657", privateKey, 10);
 * const result = await command.execute();
 *
 * // Fetch 5 blocks starting from height 100
 * const command = new GetCosmosBlocksCommand("http://localhost:26657", privateKey, 5, 100);
 * const result = await command.execute();
 *
 * // Inject cosmos RPC URL from environment
 * const cosmosRpcUrl = process.env.COSMOS_RPC_ENDPOINT || "http://localhost:26657";
 * const command = new GetCosmosBlocksCommand(cosmosRpcUrl, privateKey, 20);
 * const result = await command.execute();
 */

import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { getCosmosClient } from "@bitcoinbrisbane/block52";
import { DEFAULT_COSMOS_CONFIG } from "../state/cosmos/config";

export interface CosmosBlockInfo {
    height: number;
    hash: string;
    time: string;
    proposer: string;
    txCount: number;
    chainId: string;
}

export class GetCosmosBlocksCommand implements ISignedCommand<CosmosBlockInfo[]> {
    private readonly cosmosRpcUrl: string;
    private readonly privateKey: string;
    private readonly count: number;
    private readonly startHeight?: number;

    constructor(cosmosRpcUrl: string, privateKey: string, count: number = 10, startHeight?: number) {
        this.cosmosRpcUrl = cosmosRpcUrl;
        this.privateKey = privateKey;
        this.count = count;
        this.startHeight = startHeight;
    }

    public async execute(): Promise<ISignedResponse<CosmosBlockInfo[]>> {
        try {
            // Create cosmos config with injected RPC URL
            const config = {
                ...DEFAULT_COSMOS_CONFIG,
                rpcEndpoint: this.cosmosRpcUrl
            };

            // Get cosmos client
            const cosmosClient = getCosmosClient(config);

            // Fetch blocks
            let blocks;
            if (this.startHeight !== undefined) {
                // Fetch blocks starting from specific height
                blocks = await cosmosClient.getBlocks(this.startHeight, this.count);
            } else {
                // Fetch latest blocks
                blocks = await cosmosClient.getLatestBlocks(this.count);
            }

            // Transform cosmos blocks to our format
            const cosmosBlockInfo: CosmosBlockInfo[] = blocks.map(block => ({
                height: block.block.header.height,
                hash: Buffer.from(block.blockId.hash).toString("hex").toUpperCase(),
                time: block.block.header.time.toISOString(),
                proposer: Buffer.from(block.block.header.proposerAddress).toString("hex").toUpperCase(),
                txCount: block.block.txs.length,
                chainId: block.block.header.chainId
            }));

            return signResult(cosmosBlockInfo, this.privateKey);
        } catch (error) {
            console.error("Failed to fetch cosmos blocks:", error);
            throw new Error(`Failed to fetch cosmos blocks: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
}
