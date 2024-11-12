import { AccountDTO, BlockDTO, TransactionDTO } from "./types/chain";
import { TexasHoldemDTO } from "./types/game";
import { RPCMethods, RPCRequest } from "./types/rpc";
import { RPCResponse } from "./types/rpc";
import axios from "axios";
import { Wallet } from "ethers";

/**
 * NodeRpcClient class for interacting with a remote node via RPC
 */
export class NodeRpcClient {
    private wallet: Wallet;
    constructor(private url: string, private privateKey: string) {
        this.wallet = new Wallet(privateKey);
    }

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
     * Create an account
     * @param privateKey The private key of the account
     * @returns A Promise that resolves when the request is complete
     */
    public async createAccount(privateKey: string): Promise<void> {
        await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.CREATE_ACCOUNT,
            params: [privateKey],
            data: undefined
        });
    }

    /**
     * Get the mempool from the remote node
     * @returns A Promise resolving to an array of Transaction objects
     */
    public async getMempool(): Promise<TransactionDTO[]> {
        const { data: body } = await axios.post<
            RPCRequest,
            { data: RPCResponse<TransactionDTO[]> }
        >(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.GET_MEMPOOL,
            params: [],
            data: undefined
        });
        // Convert the received TransactionDTO objects to Transaction instances
        return body.result.data;
    }

    /**
     * Get the list of nodes known to the remote node
     * @returns A Promise resolving to an array of node URLs
     */
    public async getNodes(): Promise<string[]> {
        const { data: body} = await axios.post<
            RPCRequest,
            { data: RPCResponse<string[]> }
        >(this.url, {
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
    public async getLastBlock(): Promise<BlockDTO> {
        const { data: body } = await axios.post<RPCRequest, {data: RPCResponse<BlockDTO>}>(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.GET_LAST_BLOCK,
            params: [],
        });
        // Convert the received BlockDTO to a Block instance
        return body.result.data;
    }

    /**
     * Get a list of blocks from the remote node
     * @param count The number of blocks to get
     * @returns A Promise resolving to an array of Block objects
     */
    public async getBlocks(count?: number): Promise<BlockDTO[]> {
        const { data: body } = await axios.post<RPCRequest, {data: RPCResponse<BlockDTO[]>}>
        (this.url, {
            id: this.getRequestId(),
            method: RPCMethods.GET_BLOCKS,
            params: [count ?? 100],
        });
        return body.result.data;
    }

    /**
     * Send a block hash to the remote node
     * @param blockHash The hash of the block to send
     * @returns A Promise that resolves when the request is complete
     */
    public async sendBlockHash(blockHash: string): Promise<void> {
        await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.MINED_BLOCK_HASH,
            params: [blockHash],
        });
    }

    /**
     * Get the list of transactions from the remote node
     * @returns A Promise resolving to an array of Transaction objects
     */
    public async getTransactions(): Promise<TransactionDTO[]> {
       const { data: body } = await axios.post<RPCRequest, {data: RPCResponse<TransactionDTO[]>}>(this.url, {
        id: this.getRequestId(),
        method: RPCMethods.GET_TRANSACTIONS,
        params: [],
       });
       return body.result.data;
    }

    /**
     * Transfer funds from one account to another
     * @param from The address of the sender
     * @param to The address of the recipient
     * @param amount The amount to transfer
     * @returns A Promise that resolves when the request is complete
     */
    public async transfer(from: string, to: string, amount: string, data?: string): Promise<void> {
        await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.TRANSFER,
            params: [from, to, amount, data],
        });
    }

    /**
     * Mint funds to an account
     * @param address The address of the recipient
     * @param amount The amount to mint
     * @param transactionId The transaction ID
     * @returns A Promise that resolves when the request is complete
     */
    public async mint(address: string, amount: string, transactionId: string): Promise<void> {
        await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.MINT,
            params: [address, amount, transactionId],
        });
    }

    public async getAccount(address: string): Promise<AccountDTO> {
        console.log(`Getting account ${address} from url ${this.url}`);
        const { data: body } = await axios.post<RPCRequest, {data: RPCResponse<AccountDTO>}>(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.GET_ACCOUNT,
            params: [address],
        });
        return body.result.data;
    }

    public async fold(gameAddress: string): Promise<void> {
        const gameCommand = {
            method: "fold",
            params: [],
        };
        await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.TRANSFER,
            params: [ this.wallet.address, gameAddress, "0", JSON.stringify(gameCommand)],
        });
    }

    public async call(gameAddress: string): Promise<void> {
        const gameCommand = {
            method: "call",
            params: []
        };
        await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.TRANSFER,
            params: [ this.wallet.address, gameAddress, "0", JSON.stringify(gameCommand)],
        });
    }

    public async raise(gameAddress: string, amount: string): Promise<void> {
        const gameCommand = {
            method: "raise",
            params: [amount],
        };
        await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.TRANSFER,
            params: [ this.wallet.address, gameAddress, amount, JSON.stringify(gameCommand)],
        });
    }

    public async check(gameAddress: string): Promise<void> {
        const gameCommand = {
            method: "check",
            params: [],
        };
        await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.TRANSFER,
            params: [ this.wallet.address, gameAddress, "0", JSON.stringify(gameCommand)],
        });
    }

    public async getGameState(gameAddress: string): Promise<TexasHoldemDTO> {
        const { data: body } = await axios.post<RPCRequest, {data: RPCResponse<TexasHoldemDTO>}>
        (this.url, {
            id: this.getRequestId(),
            method: RPCMethods.GET_GAME_STATE,
            params: [gameAddress],
        });
        return body.result.data;
    }
}
