import { AccountDTO, BlockDTO, TransactionDTO } from "./types/chain";
import { PlayerActionType, TexasHoldemStateDTO } from "./types/game";
import { RPCMethods, RPCRequest } from "./types/rpc";
import { RPCResponse } from "./types/rpc";
import axios from "axios";
import { Wallet } from "ethers";

/**
 * NodeRpcClient class for interacting with a remote node via RPC
 */
export class NodeRpcClient {
    private readonly wallet: Wallet | undefined;
    private requestId: number = 0;
    constructor(private url: string, private privateKey: string) {
        if (privateKey.length === 66) {
            this.wallet = new Wallet(privateKey);
        }
    }

    /**
     * Get a random request ID
     * @returns The request ID
     */
    private getRequestId(): string {
        this.requestId++;
        return this.requestId.toString();
    }

    /**
     * Get the address of the account
     * @returns The address of the account
     */
    private getAddress(): string {
        if (!this.wallet) {
            throw new Error("Cannot get address without a private key");
        }
        return this.wallet.address;
    }

    /**
     * Get the account balance from the remote node
     * @param address The address of the account
     * @returns A Promise resolving to an Account object
     */
    public async getAccount(address: string): Promise<AccountDTO> {
        const { data: body } = await axios.post<RPCRequest, { data: RPCResponse<AccountDTO> }>(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.GET_ACCOUNT,
            params: [address]
        });
        return body.result.data;
    }

    /**
     * Get the mempool from the remote node
     * @returns A Promise resolving to an array of Transaction objects
     */
    public async getMempool(): Promise<TransactionDTO[]> {
        const { data: body } = await axios.post<RPCRequest, { data: RPCResponse<TransactionDTO[]> }>(this.url, {
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
        const { data: body } = await axios.post<RPCRequest, { data: RPCResponse<string[]> }>(this.url, {
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
        const { data: body } = await axios.post<RPCRequest, { data: RPCResponse<BlockDTO> }>(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.GET_LAST_BLOCK,
            params: [],
            data: undefined
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
        const { data: body } = await axios.post<RPCRequest, { data: RPCResponse<BlockDTO[]> }>(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.GET_BLOCKS,
            params: [count ?? 100],
            data: undefined
        });
        return body.result.data;
    }

    /**
     * Get a block from the remote node
     * @param index The index of the block to get
     * @returns A Promise resolving to a of Block object
     */
    public async getBlock(index: number): Promise<BlockDTO> {
        const { data: body } = await axios.post<RPCRequest, { data: RPCResponse<BlockDTO> }>(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.GET_BLOCK,
            params: [index.toString()]
        });
        return body.result.data;
    }

    /**
     * Get a block from the remote node
     * @param index The index of the block to get
     * @returns A Promise resolving to a of Block object
     */
    public async getBlockByHash(hash: string): Promise<BlockDTO> {
        const { data: body } = await axios.post<RPCRequest, { data: RPCResponse<BlockDTO> }>(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.GET_BLOCK,
            params: [hash]
        });
        return body.result.data;
    }

    /**
     * Get the block height from the remote node
     * @returns A Promise resolving to the block height
     */
    public async getBlockHeight(): Promise<number> {
        const { data: body } = await axios.post<RPCRequest, { data: RPCResponse<number> }>(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.GET_BLOCK_HEIGHT,
            params: []
        });
        return body.result.data;
    }

    /**
     * Send a block to the remote node
     * @param blockHash The hash of the block to send
     * @param block The block to send
     * @returns A Promise that resolves when the request is complete
     */
    public async sendBlock(blockHash: string, block: string): Promise<void> {
        await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.BLOCK,
            params: [blockHash, block]
        });
    }

    /**
     * Send a block hash to the remote node
     * @param blockHash The hash of the block to send
     * @param nodeUrl The URL of the node to send the block from
     * @returns A Promise that resolves when the request is complete
     */
    public async sendBlockHash(blockHash: string, nodeUrl: string): Promise<void> {
        await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.MINED_BLOCK_HASH,
            params: [blockHash, nodeUrl]
        });
    }

    /**
     * Get the list of transactions from the remote node
     * @returns A Promise resolving to an array of Transaction objects
     */
    public async getTransactions(): Promise<TransactionDTO[]> {
        const { data: body } = await axios.post<RPCRequest, { data: RPCResponse<TransactionDTO[]> }>(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.GET_TRANSACTIONS,
            params: []
        });
        return body.result.data;
    }

    /**
     * Transfer funds from one account to another
     * @param to The address of the recipient
     * @param nonce The nonce of the transaction
     * @param amount The amount to transfer
     * @returns A Promise that resolves when the request is complete
     */
    public async transfer(to: string, amount: string, nonce?: number, data?: string): Promise<any> {
        const from = this.getAddress();
        const signature = await this.getSignature(nonce);

        const { data: body } = await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.TRANSFER,
            params: [from, to, amount, nonce, data, signature]
        });

        return body.result.data;
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
            params: [address, amount, transactionId]
        });
    }

    /**
     * Get the state of a Texas Holdem game
     * @param gameAddress The address of the game
     * @returns A Promise that resolves to a TexasHoldemState object
    */
    public async getGameState(gameAddress: string): Promise<TexasHoldemStateDTO> {
        const { data: body } = await axios.post<RPCRequest, { data: RPCResponse<TexasHoldemStateDTO> }>(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.GET_GAME_STATE,
            params: [gameAddress]
        });

        return body.result.data;
    }

    public async playerJoin(gameAddress: string, amount: bigint, nonce?: number): Promise<any> {
        const address = this.getAddress();
        const signature = await this.getSignature(nonce);

        const { data: body } = await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.TRANSFER,
            params: [address, gameAddress, amount.toString(), "join", signature]
        });

        return body.result.data;
    }

    public async playerAction(gameAddress: string, action: PlayerActionType, amount: string, nonce?: number): Promise<any> {
        const signature = await this.getSignature(nonce);
        const address = this.getAddress();

        const { data: body } = await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.TRANSFER,
            params: [address, gameAddress, amount.toString(), action, signature]
        });

        return body.result.data;
    }

    private async getSignature(nonce?: number): Promise<string> {
        if (!this.wallet) {
            throw new Error("Cannot transfer funds without a private key");
        }

        const address = this.wallet.address;

        if (!nonce) {
            const account = await this.getAccount(address);
            nonce = account.nonce;
        }

        const signature = await this.wallet.signMessage(nonce.toString());
        return signature;
    }

    /**
     * Deal cards in a Texas Holdem game
     * @param gameAddress The address of the game
     * @param seed Optional seed for shuffling
     * @returns A Promise that resolves to the transaction
     */
    public async deal(gameAddress: string, seed: string = ""): Promise<any> {
        const address = this.getAddress();
        const signature = await this.getSignature();

        const { data: body } = await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.DEAL,
            params: [gameAddress, seed],
            data: address,  // Pass the player's address in the data field
            signature: signature
        });

        return body.result.data;
    }
}
