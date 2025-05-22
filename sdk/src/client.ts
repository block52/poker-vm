import { AccountDTO, BlockDTO, TransactionDTO } from "./types/chain";
import {
    GameOptionsDTO,
    LegalActionDTO,
    NonPlayerActionType,
    PerformActionResponse,
    PlayerActionType,
    TexasHoldemStateDTO,
    TransactionResponse
} from "./types/game";
import { RPCMethods, RPCRequest } from "./types/rpc";
import { RPCResponse } from "./types/rpc";
import axios from "axios";
import { Wallet } from "ethers";

export interface IClient {
    deal(gameAddress: string, seed: string, publicKey: string, nonce?: number): Promise<PerformActionResponse>;
    findGames(min?: bigint, max?: bigint): Promise<GameOptionsDTO[]>;
    getAccount(address: string): Promise<AccountDTO>;
    getBlock(index: number): Promise<BlockDTO>;
    getBlockByHash(hash: string): Promise<BlockDTO>;
    getBlockHeight(): Promise<number>;
    getBlocks(count?: number): Promise<BlockDTO[]>;
    getGameState(gameAddress: string, caller: string): Promise<TexasHoldemStateDTO>;
    getLastBlock(): Promise<BlockDTO>;
    getLegalActions(gameAddress: string, caller: string): Promise<LegalActionDTO[]>;
    getMempool(): Promise<TransactionDTO[]>;
    getNodes(): Promise<string[]>;
    getTransactions(): Promise<TransactionDTO[]>;
    mint(address: string, amount: string, transactionId: string): Promise<void>;
    newHand(gameAddress: string, seed?: string, nonce?: number): Promise<TransactionResponse>;
    newTable(schemaAddress: string, owner: string, nonce?: number): Promise<string>;
    playerAction(gameAddress: string, action: PlayerActionType, amount: string, nonce?: number, data?: string): Promise<PerformActionResponse>;
    playerJoin(gameAddress: string, amount: bigint, seat: number, nonce?: number): Promise<PerformActionResponse>;
    playerLeave(gameAddress: string, amount: bigint, nonce?: number): Promise<PerformActionResponse>;
    sendBlock(blockHash: string, block: string): Promise<void>;
    sendBlockHash(blockHash: string, nodeUrl: string): Promise<void>;
    transfer(to: string, amount: string, nonce?: number, data?: string): Promise<TransactionResponse>;
}

/**
 * NodeRpcClient class for interacting with a remote node via RPC
 */
export class NodeRpcClient implements IClient {
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
     * Find games on the remote node
     * @param smallBlind The minimum smallBlind amount
     * @param bigBlind The maximum bigBlind amount
     * @returns A Promise resolving to an array of GameOptionsDTO objects
     */
    public async findGames(smallBlind?: bigint, bigBlind?: bigint): Promise<GameOptionsDTO[]> {
        const query = "" + (smallBlind ? `sb=${smallBlind}` : "") + (bigBlind ? `,bb=${bigBlind}` : "");

        // If no query is provided, return an empty array
        if (!query) {
            return [];
        }

        const { data: body } = await axios.post<RPCRequest, { data: RPCResponse<GameOptionsDTO[]> }>(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.FIND_CONTRACT,
            params: [query]
        });
        return body.result.data;
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
    public async transfer(to: string, amount: string, nonce?: number, data?: string): Promise<TransactionResponse> {
        const from = this.getAddress();
        if (!nonce) {
            nonce = await this.getNonce(from);
        }
        const signature = await this.getSignature(nonce);

        const { data: body } = await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.TRANSFER,
            params: [from, to, amount, nonce, data],
            signature: signature
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
     * @param caller The address of the caller
     * @returns A Promise that resolves to a TexasHoldemState object
     */
    public async getGameState(gameAddress: string, caller: string): Promise<TexasHoldemStateDTO> {
        const { data: body } = await axios.post<RPCRequest, { data: RPCResponse<TexasHoldemStateDTO> }>(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.GET_GAME_STATE,
            params: [gameAddress, caller]
        });

        return body.result.data;
    }

    /**
     * Get the state of a Texas Holdem game
     * @param gameAddress The address of the game
     * @param playerId The address of the player
     * @returns A Promise that resolves to a TexasHoldemState object
     */
    public async getLegalActions(gameAddress: string, playerId: string): Promise<LegalActionDTO[]> {
        const gameState: TexasHoldemStateDTO = await this.getGameState(gameAddress, playerId);

        if (!gameState) {
            throw new Error("Game state not found");
        }

        // Find the player
        const player = gameState.players.find(p => p.address === playerId);
        if (!player) {
            throw new Error("Player not found in game state");
        }

        // Get the legal actions for the player
        return player.legalActions;
    }

    /**
     * Create a new game on the remote node
     * @param gameAddress The address of the game
     * @param seed The seed for new deck
     * @param nonce The nonce of the transaction
     * @returns A Promise that resolves to the transaction
     */
    public async newHand(gameAddress: string, seed?: string, nonce?: number): Promise<TransactionResponse> {
        const address = this.getAddress();

        if (!nonce) {
            nonce = await this.getNonce(this.getAddress());
        }

        const signature = await this.getSignature(nonce);
        const index = await this.getNextActionIndex(gameAddress, address);

        if (!seed || !/^[0-9]{52}$/.test(seed)) {
            seed = this.generateRandomNumber();
        }

        const { data: body } = await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.PERFORM_ACTION, // not NEW_HAND any more
            params: [address, gameAddress, NonPlayerActionType.NEW_HAND, undefined, nonce, index, seed], // [from, to, action, amount, nonce, index, data]
            signature: signature
        });

        return body.result.data;
    }

    /**
     * Create a new game table on the remote node
     * @param schemaAddress The address of the schema to use for the table
     * @param owner The address of the table owner
     * @param nonce The nonce of the transaction
     * @returns A Promise that resolves to the table address
     */
    public async newTable(schemaAddress: string, owner: string, nonce?: number): Promise<string> {
        if (!nonce) {
            nonce = await this.getNonce(this.getAddress());
        }

        const signature = await this.getSignature(nonce);

        const { data: body } = await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.NEW_TABLE,
            params: [schemaAddress, owner, nonce], // [to, from, nonce]
            signature: signature
        });

        return body.result.data;
    }

    /**
     * Join a Texas Holdem game
     * @param gameAddress The address of the game
     * @param amount The amount to join with
     * @param seat The seat number to join
     * @param nonce The nonce of the transaction
     * @returns A Promise that resolves to the transaction
     */
    public async playerJoin(gameAddress: string, amount: bigint, seat: number, nonce?: number): Promise<PerformActionResponse> {
        const address = this.getAddress();

        if (!nonce) {
            nonce = await this.getNonce(address);
        }

        const [signature, index] = await Promise.all([this.getSignature(nonce), this.getNextActionIndex(gameAddress, address)]);

        // Pack the seat into the data field
        const data = seat.toString();

        const { data: body } = await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [address, gameAddress, NonPlayerActionType.JOIN, amount.toString(), nonce, index, data], // [from, to, action, amount, nonce, index, data]
            signature: signature
        });

        return body.result.data;
    }

    /**
     * Perform an action in a Texas Holdem game
     * @param gameAddress The address of the game
     * @param action
     * @param amount
     * @param nonce
     * @returns
     */
    public async playerAction(gameAddress: string, action: PlayerActionType, amount: string, nonce?: number): Promise<PerformActionResponse> {
        try {
            const address = this.getAddress();

            if (!nonce) {
                nonce = await this.getNonce(address);
            }

            const legalActions = await this.getLegalActions(gameAddress, address);
            const legalAction = legalActions.find(a => a.action === action);
            if (!legalAction) {
                throw new Error(`Illegal action: ${action}`);
            }

            const [signature, index] = await Promise.all([this.getSignature(nonce), this.getNextActionIndex(gameAddress, address)]);

            const { data: body } = await axios.post(this.url, {
                id: 1, // this.getRequestId(),
                method: RPCMethods.PERFORM_ACTION,
                params: [address, gameAddress, action, amount, nonce, index], // [from, to, action, amount, nonce, index]
                signature: signature
            });

            return body.result.data;
        } catch (error) {
            console.error(`Error in playerAction: ${(error as Error).message}`);
            throw error; // Rethrow the error to be handled by the caller
        }
    }

    /**
     * Leave a Texas Holdem game
     * @param gameAddress The address of the game
     * @param amount The amount to leave with
     * @param nonce The nonce of the transaction
     * @returns A Promise that resolves to the transaction
     */
    public async playerLeave(gameAddress: string, amount: bigint, nonce?: number): Promise<PerformActionResponse> {
        const address = this.getAddress();

        if (!nonce) {
            nonce = await this.getNonce(address);
        }

        const [signature, index] = await Promise.all([this.getSignature(nonce), this.getNextActionIndex(gameAddress, address)]);

        const { data: body } = await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [address, gameAddress, NonPlayerActionType.LEAVE, amount.toString(), nonce, index], // [from, to, action, amount, nonce, index]
            signature: signature
        });

        return body.result.data;
    }

    /**
     * Deal cards in a Texas Holdem game
     * @param gameAddress The address of the game
     * @param seed Optional seed for shuffling
     * @returns A Promise that resolves to the transaction
     */
    public async deal(gameAddress: string, seed: string = "", publicKey: string, nonce?: number): Promise<PerformActionResponse> {
        const address = this.getAddress();
        const [signature, index] = await Promise.all([this.getSignature(nonce), this.getNextActionIndex(gameAddress, address)]);

        if (!nonce) {
            nonce = await this.getNonce(address);
        }

        const { data: body } = await axios.post(this.url, {
            id: this.getRequestId(),
            method: RPCMethods.PERFORM_ACTION,
            params: [address, gameAddress, NonPlayerActionType.DEAL, "0", nonce, index], // [from, to, action, amount, nonce, index]
            data: publicKey, // todo; work out what we will use data for
            signature: signature
        });

        return body.result.data;
    }

    private async getSignature(nonce?: number): Promise<string> {
        if (!this.wallet) {
            throw new Error("Cannot transfer funds without a private key");
        }

        const address = this.wallet.address;

        if (!nonce) {
            nonce = await this.getNonce(address);
        }

        const signature = await this.wallet.signMessage(nonce.toString());
        return signature;
    }

    private async getNextActionIndex(gameAddress: string, playerId: string): Promise<number> {
        try {
            const gameState = await this.getGameState(gameAddress, playerId);
            if (!gameState) {
                throw new Error("Game state not found");
            }

            if (!gameState.previousActions || gameState.previousActions.length === 0) {
                return gameState.actionCount + 1;
            }

            const lastAction = gameState.previousActions[gameState.previousActions.length - 1];
            return gameState.actionCount + lastAction.index + 1;
        } catch (error) {
            console.error(`Error getting next action index: ${(error as Error).message}`);
            throw error; // Rethrow the error to be handled by the caller
        }
    }

    // private async getNextActionIndex(gameAddress: string, playerId: string): Promise<number> {
    //     try {
    //         const legalActions = await this.getLegalActions(gameAddress, playerId);
    //         if (!legalActions || legalActions.length === 0) {
    //             throw new Error("No legal actions found");
    //         }

    //         // Find the action with the highest index
    //         const action = legalActions.reduce((prev, current) => {
    //             return prev.index > current.index ? prev : current;
    //         });

    //         return action.index;
    //     } catch (error) {
    //         console.error(`Error getting next action index: ${(error as Error).message}`);
    //         throw error; // Rethrow the error to be handled by the caller
    //     }
    // }

    private async getNonce(address: string): Promise<number> {
        const response = await this.getAccount(address);

        if (response) {
            return response.nonce;
        }

        return 0;
    }

    private generateRandomNumber(): string {
        // Define the length we need
        const length = 52;

        // Create an array to store our random digits
        const digits = new Array(length);

        // Generate random values
        const randomValues = new Uint8Array(length);
        crypto.getRandomValues(randomValues);

        // Convert to digits 0-9 and ensure first digit isn't 0
        for (let i = 0; i < length; i++) {
            // Map the random bytes to digits 0-9
            digits[i] = randomValues[i] % 10;
        }

        // Ensure the first digit isn't 0 to maintain the exact length
        if (digits[0] === 0) {
            digits[0] = 1 + (randomValues[0] % 9); // Random digit from 1-9
        }

        // Join the digits into a string
        return digits.join("");
    }
}
