import { TransactionDTO } from "../types/chain";
import { RPCMethods, RPCRequest, RPCResponse } from "../types/rpc";
import axios from "axios";

export class NodeRpcClient {
    constructor(private url: string) {}

    private getRequestId(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    public async getMempool(): Promise<TransactionDTO[]> {
        const response = await axios.post<RPCRequest, {data:RPCResponse<TransactionDTO[]>} >(`${this.url}`,  {
            id: this.getRequestId(),
            method: RPCMethods.GET_MEMPOOL,
            params: [],
            data: undefined,
        });
        return response.data.result as TransactionDTO[]
    }
}

