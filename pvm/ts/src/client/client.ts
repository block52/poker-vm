import { BlockDTO } from "../core/types";
import { Block, Transaction } from "../models";
import { TransactionDTO } from "../types/chain";
import { RPCMethods, RPCRequest, RPCResponse } from "../types/rpc";
import axios from "axios";

/**
 * NodeRpcClient class for interacting with a remote node via RPC
 */
export class NodeRpcClient {
    constructor(private url: string) {}

    /**
     * Get a random request ID
     * @returns The request ID
     */
    private getRequestId(): string {
        return (
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15)
        );
    }

    /**
     * Get the mempool from the remote node
     * @returns A Promise resolving to an array of Transaction objects
     */
    public async getMempool(): Promise<Transaction[]> {
        const { data: body } = await axios.post<
            RPCRequest,
            { data: RPCResponse<TransactionDTO[]> }
        >(`${this.url}`, {
            id: this.getRequestId(),
            method: RPCMethods.GET_MEMPOOL,
            params: [],
            data: undefined
        });
        // Convert the received TransactionDTO objects to Transaction instances
        return body.result.data.map(Transaction.fromJson);
    }

    /**
     * Get the list of nodes known to the remote node
     * @returns A Promise resolving to an array of node URLs
     */
    public async getNodes(): Promise<string[]> {
        const { data: body} = await axios.post<
            RPCRequest,
            { data: RPCResponse<string[]> }
        >(`${this.url}`, {
            id: this.getRequestId(),
            method: RPCMethods.GET_NODES,
            params: [],
            data: undefined
        });
        return body.result.data;
    }

    /**
     * Get the last block from the remote node
     * @returns A Promise resolving to a Block object
     */
    public async getLastBlock(): Promise<Block> {
        const { data: body } = await axios.post<RPCRequest, {data: RPCResponse<BlockDTO>}>(`${this.url}`, {
            id: this.getRequestId(),
            method: RPCMethods.GET_LAST_BLOCK,
            params: [],
            data: undefined
        });
        // Convert the received BlockDTO to a Block instance
        return Block.fromJson(body.result.data);
    }

    /**
     * Send a block hash to the remote node
     * @param blockHash The hash of the block to send
     * @returns A Promise that resolves when the request is complete
     */
    public async sendBlockHash(blockHash: string): Promise<void> {
        await axios.post(`${this.url}`, {
            id: this.getRequestId(),
            method: RPCMethods.MINED_BLOCK_HASH,
            params: [blockHash],
            data: undefined
        });
    }
}
