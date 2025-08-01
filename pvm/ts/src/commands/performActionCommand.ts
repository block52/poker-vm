import { KEYS, NonPlayerActionType, PlayerActionType, TransactionResponse } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models";
import { ICommand, ISignedResponse } from "./interfaces";
import { getGameManagementInstance, getTransactionInstance } from "../state/index";
import TexasHoldemGame from "../engine/texasHoldem";
import { signResult } from "./abstractSignedCommand";
import { IGameManagement, ITransactionManagement } from "../state/interfaces";
import { toOrderedTransaction } from "../utils/parsers";

export class PerformActionCommand implements ICommand<ISignedResponse<TransactionResponse>> {
    protected readonly gameManagement: IGameManagement;
    protected readonly transactionManagement: ITransactionManagement;
    protected readonly mempool: Mempool;

    // Check if the action is a game to account transaction
    private readonly actionTypes: NonPlayerActionType[] = [NonPlayerActionType.JOIN, NonPlayerActionType.LEAVE];

    constructor(
        protected readonly from: string,
        protected readonly to: string,
        protected readonly index: number, // Allow array for join actions with seat number
        protected readonly amount: bigint,
        protected readonly action: PlayerActionType | NonPlayerActionType,
        protected readonly nonce: number,
        protected readonly privateKey: string,
        protected readonly data?: string,
        protected readonly txHash?: string // Optional transaction hash for reference
    ) {
        console.log(`Creating PerformActionCommand: from=${from}, to=${to}, amount=${amount}, action=${action}, data=${data}`);
        this.gameManagement = getGameManagementInstance();
        this.transactionManagement = getTransactionInstance();
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<TransactionResponse>> {
        console.log(`Executing ${this.action} command...`);

        if (await !this.isGameTransaction(this.to)) {
            console.log(`Not a game transaction, checking if ${this.to} is a game...`);
            throw new Error("Not a game transaction");
        }

        if (this.actionTypes.includes(this.action as NonPlayerActionType)) {

            if (!this.txHash) {
                console.log(`No transaction hash provided, creating a new transaction...`);
                throw new Error(`Invalid action type: ${this.action}. Must be one of ${this.actionTypes.join(", ")} or provide a transaction hash.`);
            }

            console.log(`Using provided transaction hash: ${this.txHash}`);

            // Check if the transaction exists in the mempool or the transaction management
            const existingTransaction = await this.findTransactionByHash(this.txHash);

            if (existingTransaction.value !== this.amount) {
                console.log(`Transaction found in transaction management with different amount: ${existingTransaction.value} !== ${this.amount}`);
                throw new Error("Transaction amount mismatch");
            }

            if (existingTransaction.to !== this.to || existingTransaction.from !== this.from) {
                console.log(`Transaction found in transaction management with different addresses: ${existingTransaction.to} !== ${this.to} or ${existingTransaction.from} !== ${this.from}`);
                throw new Error("Transaction address mismatch");
            }

        }

        console.log(`Processing game transaction: action=${this.action} data=${this.data}, to=${this.to}`);
        const gameState = await this.gameManagement.getByAddress(this.to);

        if (!gameState) {
            throw new Error(`Game state not found for address: ${this.to}`);
        }

        const gameOptions = await this.gameManagement.getGameOptions(gameState.address);
        const game: TexasHoldemGame = TexasHoldemGame.fromJson(gameState.state, gameOptions);

        // Get mempool transactions for the game
        const mempoolTransactions: Transaction[] = this.mempool.findAll(tx => tx.to === this.to && tx.data !== undefined);
        console.log(`Found ${mempoolTransactions.length} mempool transactions`);

        // Sort transactions by index
        const orderedTransactions = mempoolTransactions.map(tx => toOrderedTransaction(tx)).sort((a, b) => a.index - b.index);

        orderedTransactions.forEach(tx => {
            try {
                {
                    console.log(`Processing ${tx.type} action from ${tx.from} with value ${tx.value}, index ${tx.index}, and data ${tx.data}`);
                    game.performAction(tx.from, tx.type, tx.index, tx.value, tx.data);
                }
            } catch (error) {
                console.warn(`Error processing transaction ${tx.index} from ${tx.from}: ${(error as Error).message}`);
                // Continue with other transactions, don't let this error propagate up
            }
        });

        const nonce = BigInt(this.nonce);

        // const _to = this.action === NonPlayerActionType.LEAVE ? this.from : this.to;
        // const _from = this.action === NonPlayerActionType.LEAVE ? this.to : this.from;

        // Create transaction with correct direction of funds flow
        // For all other actions: URLSearchParams format
        const params = new URLSearchParams();
        params.set(KEYS.ACTION_TYPE, this.action);
        params.set(KEYS.INDEX, this.index.toString());
        if (this.txHash)
            params.set(KEYS.TX_HASH, this.txHash); // Optional transaction hash

        // Extract clean data using the parser (single responsibility)
        // const paramsString = extractDataFromParams(this.data);

        // console.log(`Performing action ${this.action} with index ${this.index} data ${paramsString}`);
        // game.performAction(this.from, this.action, this.index, this.amount, paramsString);
        // if (paramsString) {
        //     params.set(KEYS.DATA, paramsString); // Use KEYS.DATA instead of hardcoded "data"
        // }

        const data = params.toString();

        // if (this.action !== NonPlayerActionType.LEAVE) {
        const tx: Transaction = await Transaction.create(
            this.to, // game receives funds (to)
            this.from, // player sends funds (from)
            this.amount,
            nonce,
            this.privateKey,
            data
        );

        await this.mempool.add(tx);

        const txResponse: TransactionResponse = {
            nonce: tx.nonce.toString(),
            to: tx.to,
            from: tx.from,
            value: tx.value.toString(),
            hash: tx.hash,
            signature: tx.signature,
            timestamp: tx.timestamp.toString(),
            data: tx.data
        };

        return signResult(txResponse, this.privateKey);
        // }

        // if (this.action === NonPlayerActionType.LEAVE) {
        //     const tx: Transaction = await Transaction.create(
        //         _to, // game receives funds (to)
        //         _from, // player sends funds (from)
        //         this.amount,
        //         nonce,
        //         this.privateKey,
        //         "" // No data for regular transactions
        //     );

        //     const actionTx = await Transaction.create(
        //         this.to,
        //         this.from,
        //         this.amount,
        //         nonce + 1n, // Increment nonce for action transaction
        //         this.privateKey,
        //         data
        //     );

        //     // Add both transactions to the mempool
        //     const txs = await Promise.all([tx, actionTx]);

        //     const txResponse: TransactionResponse = {
        //         nonce: tx.nonce.toString(),
        //         to: tx.to,
        //         from: tx.from,
        //         value: tx.value.toString(),
        //         hash: tx.hash,
        //         signature: tx.signature,
        //         timestamp: tx.timestamp.toString(),
        //         data: tx.data
        //     };

        //     const mempoolTxs = [this.mempool.add(txs[0]), this.mempool.add(txs[1])];
        //     await Promise.all(mempoolTxs);

        //     return signResult(txResponse, this.privateKey);
        // }

        // throw new Error(`Unsupported action type: ${this.action}`);
    }

    private async isGameTransaction(address: string): Promise<Boolean> {
        console.log(`Checking if ${address} is a game transaction...`);
        const game = await this.gameManagement.getByAddress(address);

        console.log(`Game found:`, address);
        const found: Boolean = game !== null;

        console.log(`Is game transaction: ${found}`);
        return found;
    }

    private async findTransactionByHash(txHash: string): Promise<Transaction> {
        console.log(`Finding transaction by hash: ${txHash}`);
        const existingTransaction = await this.transactionManagement.getTransaction(txHash);

        if (existingTransaction) {
            console.log(`Transaction found in transaction management: ${existingTransaction.hash}`);
            return existingTransaction;
        }

        const mempoolTransaction = this.mempool.find(tx => tx.hash === txHash);
        if (mempoolTransaction) {
            console.log(`Transaction found in mempool: ${mempoolTransaction.hash}`);
            return mempoolTransaction;
        }

        throw new Error("Transaction not found");
    }
}
