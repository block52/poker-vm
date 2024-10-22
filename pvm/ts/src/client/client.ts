import { BlockDTO } from "../core/types";
import { Block, Transaction } from "../models";
import { TransactionDTO } from "../types/chain";
import { RPCMethods, RPCRequest, RPCResponse } from "../types/rpc";
import axios from "axios";

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
     * Get the mempool from the other node
     * @returns The list of transactions in the mempool of the other node
     */
    public async getMempool(): Promise<Transaction[]> {
        const response = await axios.post<
            RPCRequest,
            { data: RPCResponse<TransactionDTO[]> }
        >(`${this.url}`, {
            id: this.getRequestId(),
            method: RPCMethods.GET_MEMPOOL,
            params: [],
            data: undefined
        });
        return response.data.result.map(Transaction.fromJson);
    }

    /**
     * Get the list of nodes that the other node knows about
     * @returns The list of node URLs
     */
    public async getNodes(): Promise<string[]> {
        const response = await axios.post<
            RPCRequest,
            { data: RPCResponse<string[]> }
        >(`${this.url}`, {
            id: this.getRequestId(),
            method: RPCMethods.GET_NODES,
            params: [],
            data: undefined
        });
        return response.data.result as string[];
    }

    /**
     * Get the last block from the other node
     * @returns The last block
     */
    public async getLastBlock(): Promise<Block> {
        const response = await axios.post<RPCRequest, {data: RPCResponse<BlockDTO>}>(`${this.url}`, {
            id: this.getRequestId(),
            method: RPCMethods.GET_LAST_BLOCK,
            params: [],
            data: undefined
        });
        return Block.fromJson(response.data.result);
    }

}
