import { AccountDTO, BlockDTO, TransactionDTO } from "./types/chain";
import { PlayerActionType, TexasHoldemStateDTO } from "./types/game";
import { RPCMethods, RPCRequest } from "./types/rpc";
import { RPCResponse } from "./types/rpc";
import axios from "axios";
import { Wallet } from "ethers";
import crypto from "crypto";

/**
 * NodeRpcClient class for interacting with a remote node via RPC
 */
export class NodeRpcClient {
    private readonly wallet: Wallet | undefined;
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
        return crypto.randomUUID();
    }

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
            params: []
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
            params: [count ?? 100]
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
            params: [blockHash]
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
    public async transfer(to: string, amount: string, nonce?: number, data?: string): Promise<void> {
        const from = this.getAddress();
        const signature = await this.getSignature(nonce);

        await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.TRANSFER,
            params: [from, to, amount, nonce, data, signature]
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
            params: [address, amount, transactionId]
        });
    }

    public async getGameState(gameAddress: string): Promise<TexasHoldemStateDTO> {
        const { data: body } = await axios.post<RPCRequest, { data: RPCResponse<TexasHoldemStateDTO> }>(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.GET_GAME_STATE,
            params: [gameAddress]
        });
        return body.result.data;
    }

    public async playerJoin(gameAddress: string, nonce?: number): Promise<void> {
        const gameCommand = {
            method: "join"
        };

        const address = this.getAddress();
        const signature = await this.getSignature(nonce);

        await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.TRANSFER,
            params: [address, gameAddress, "0", JSON.stringify(gameCommand), signature]
        });
    }

    public async playerAction(gameAddress: string, action: PlayerActionType, amount: string, nonce?: number): Promise<void> {
        const gameCommand = {
            method: action,
            params: [amount]
        };

        const signature = await this.getSignature(nonce);
        const address = this.getAddress();

        await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.TRANSFER,
            params: [address, gameAddress, "0", JSON.stringify(gameCommand), signature]
        });
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
}
