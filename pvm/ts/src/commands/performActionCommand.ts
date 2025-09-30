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

    constructor(
        protected readonly from: string,
        protected readonly to: string,
        protected readonly index: number, // Allow array for join actions with seat number
        protected readonly value: bigint,
        protected readonly action: PlayerActionType | NonPlayerActionType,
        protected readonly nonce: number,
        protected readonly privateKey: string,
        protected readonly data?: string,
        protected readonly addToMempool: boolean = true // Whether to add the transaction to the mempool
    ) {
        console.log(`Creating PerformActionCommand: from=${from}, to=${to}, value=${value}, action=${action}, data=${data}`);
        
        this.gameManagement = getGameManagementInstance();
        this.transactionManagement = getTransactionInstance();
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<TransactionResponse>> {
        console.log(`Executing ${this.action} command...`);

        if (!(await this.isGameTransaction(this.to))) {
            console.log(`Not a game transaction, checking if ${this.to} is a game...`);
            throw new Error("Not a game transaction");
        }

        console.log(`Processing game transaction: action=${this.action} data=${this.data}, to=${this.to}`);
        const gameState = await this.gameManagement.getByAddress(this.to);

        if (!gameState) {
            throw new Error(`Game state not found for address: ${this.to}`);
        }

        const nonce = BigInt(this.nonce);
        const params = new URLSearchParams();
        params.set(KEYS.ACTION_TYPE, this.action.toString());
        params.set(KEYS.INDEX, this.index.toString());
        params.set(KEYS.VALUE, this.value.toString());

        // If data is provided, append it to the params
        if (this.data) {
            const dataParams = new URLSearchParams(this.data);
            for (const [key, value] of dataParams.entries()) {
                params.set(key, value);
            }
        }

        const encodedData = params.toString();
        const tx: Transaction = await Transaction.create(
            this.to, // game receives funds (to)
            this.from, // player sends funds (from)
            this.value, // no value for game actions
            nonce,
            this.privateKey,
            encodedData
        );

        // If the tx is a contract to account action or a account to contract action, we dont want to add it to the mempool
        if (this.addToMempool && !this.mempool.has(tx.hash)) {
            await this.mempool.add(tx);
            console.log(`Added transaction to mempool: ${tx.hash}`);
        }

        // Get mempool transactions for the game
        const mempoolTransactions: Transaction[] = this.mempool.findAll(tx => tx.to === this.to && tx.data !== undefined && tx.data !== null && tx.data !== "");
        console.log(`Found ${mempoolTransactions.length} mempool transactions`);

        // Sort transactions by index
        const orderedTransactions = mempoolTransactions.map(tx => toOrderedTransaction(tx)).sort((a, b) => a.index - b.index);
        if (!this.addToMempool) {
            // If we're not adding to the mempool, we still need to process the transaction
            orderedTransactions.push(toOrderedTransaction(tx));
            console.log(`Added current transaction to ordered transactions: ${tx.hash}`);
        }

        const gameOptions = await this.gameManagement.getGameOptions(gameState.address);
        const game: TexasHoldemGame = TexasHoldemGame.fromJson(gameState.state, gameOptions);

        orderedTransactions.forEach(tx => {
            try {
                console.log(`Processing ${tx.type} action from ${tx.from} with value ${tx.value}, index ${tx.index}, and data ${tx.data}`);
                game.performAction(tx.from, tx.type, tx.index, tx.value, tx.data);

            } catch (error) {
                console.warn(`Error processing transaction ${tx.index} from ${tx.from}: ${(error as Error).message}`);
                // Continue with other transactions, don't let this error propagate up
            }
        });


        const txResponse: TransactionResponse = {
            nonce: tx.nonce.toString(),
            to: tx.to,
            from: tx.from,
            value: this.value.toString(),
            hash: tx.hash,
            signature: tx.signature,
            timestamp: tx.timestamp.toString(),
            data: encodedData
        };

        return signResult(txResponse, this.privateKey);
    }

    private async isGameTransaction(address: string): Promise<Boolean> {
        console.log(`Checking if ${address} is a game transaction...`);
        const game = await this.gameManagement.getByAddress(address);

        console.log(`Game found:`, address);
        const found: Boolean = game !== null;

        console.log(`Is game transaction: ${found}`);
        return found;
    }
}
