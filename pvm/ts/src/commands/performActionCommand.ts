import { NonPlayerActionType, PlayerActionType, TransactionResponse } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models";
import { ICommand, ISignedResponse } from "./interfaces";
import { getGameManagementInstance } from "../state/index";
import TexasHoldemGame from "../engine/texasHoldem";
import { signResult } from "./abstractSignedCommand";
import { IGameManagement } from "../state/interfaces";
import { toOrderedTransaction, extractDataFromParams } from "../utils/parsers";

export class PerformActionCommand implements ICommand<ISignedResponse<TransactionResponse>> {
    protected readonly gameManagement: IGameManagement;
    protected readonly mempool: Mempool;

    constructor(
        protected readonly from: string,
        protected readonly to: string,
        protected readonly index: number, // Allow array for join actions with seat number
        protected readonly amount: bigint,
        protected readonly action: PlayerActionType | NonPlayerActionType,
        protected readonly nonce: number,
        protected readonly privateKey: string,
        protected readonly data?: string
    ) {
        console.log(`Creating PerformActionCommand: from=${from}, to=${to}, amount=${amount}, action=${action}, data=${data}`);
        this.gameManagement = getGameManagementInstance();
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<TransactionResponse>> {
        console.log(`Executing ${this.action} command...`);

        if (await !this.isGameTransaction(this.to)) {
            console.log(`Not a game transaction, checking if ${this.to} is a game...`);
            throw new Error("Not a game transaction");
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

        // Extract clean data using the parser (single responsibility)
        const cleanData = extractDataFromParams(this.data || "");
        
        console.log(`Performing action ${this.action} with index ${this.index} data ${cleanData}`);
        game.performAction(this.from, this.action, this.index, this.amount, cleanData);

        const nonce = BigInt(this.nonce);

        const _to = this.action === NonPlayerActionType.LEAVE ? this.from : this.to;
        const _from = this.action === NonPlayerActionType.LEAVE ? this.to : this.from;

        // Create transaction with correct direction of funds flow
        // For all other actions: URLSearchParams format
        const params = new URLSearchParams();
        params.set("actionType", this.action);
        params.set("index", this.index.toString());
        if (cleanData) {
            params.set("data", cleanData);  // Use the clean extracted data, not the raw URLSearchParams string
        }
        const data = params.toString();

        if (this.action !== NonPlayerActionType.LEAVE) {
            const tx: Transaction = await Transaction.create(
                _to, // game receives funds (to)
                _from, // player sends funds (from)
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
        }

        if (this.action === NonPlayerActionType.LEAVE) {
            const tx: Transaction = await Transaction.create(
                _to, // game receives funds (to)
                _from, // player sends funds (from)
                this.amount,
                nonce,
                this.privateKey,
                "" // No data for regular transactions
            );

            const actionTx = await Transaction.create(
                this.to,
                this.from,
                this.amount,
                nonce + 1n, // Increment nonce for action transaction
                this.privateKey,
                data
            );

            // Add both transactions to the mempool
            const txs = await Promise.all([tx, actionTx]);

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

            const mempoolTxs = [this.mempool.add(txs[0]), this.mempool.add(txs[1])];
            await Promise.all(mempoolTxs);

            return signResult(txResponse, this.privateKey);
        }

        throw new Error(`Unsupported action type: ${this.action}`);
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
