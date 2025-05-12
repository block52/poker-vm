import { NonPlayerActionType, PlayerActionType, TransactionResponse } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models";
import { ICommand, ISignedResponse } from "./interfaces";
import { getGameManagementInstance } from "../state/index";
import contractSchemas from "../schema/contractSchemas";
import { getContractSchemaManagement } from "../state/index";
import TexasHoldemGame from "../engine/texasHoldem";
import { signResult } from "./abstractSignedCommand";
import { OrderedTransaction } from "../engine/types";
import { IContractSchemaManagement, IGameManagement } from "../state/interfaces";

export class PerformActionCommand implements ICommand<ISignedResponse<TransactionResponse>> {
    protected readonly gameManagement: IGameManagement;
    private readonly contractSchemaManagement: IContractSchemaManagement;
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
        console.log(`Creating PerformActionCommand: from=${from}, to=${to}, amount=${amount}, data=${action}`);
        this.gameManagement = getGameManagementInstance();
        this.contractSchemaManagement = getContractSchemaManagement();
        this.mempool = getMempoolInstance();

        // Debug logging to see what we're getting in the constructor
        const indexType = Array.isArray(this.index) ? "array" : "number";
        console.log(`PerformActionCommand created with action=${action}, index=${JSON.stringify(this.index)} (${indexType})`);
    }

    public async execute(): Promise<ISignedResponse<TransactionResponse>> {
        console.log("Executing transfer command...");

        if (await !this.isGameTransaction(this.to)) {
            console.log(`Not a game transaction, checking if ${this.to} is a game...`);
            throw new Error("Not a game transaction");
        }

        console.log(`Processing game transaction: data=${this.action}, to=${this.to}`);
        const gameState = await this.gameManagement.getByAddress(this.to);

        if (!gameState) {
            throw new Error(`Game state not found for address: ${this.to}`);
        }

        const gameOptions = await this.contractSchemaManagement.getGameOptions(gameState.schemaAddress);
        const game: TexasHoldemGame = TexasHoldemGame.fromJson(gameState.state, gameOptions);

        // Get mempool transactions for the game
        const mempoolTransactions: Transaction[] = this.mempool.findAll(tx => tx.to === this.to && tx.data !== undefined);
        console.log(`Found ${mempoolTransactions.length} mempool transactions`);

        // Sort transactions by index
        const orderedTransactions = mempoolTransactions.map(tx => this.castToOrderedTransaction(tx)).sort((a, b) => a.index - b.index);

        orderedTransactions.forEach(tx => {
            try {
                {
                    game.performAction(tx.from, tx.type, tx.index, tx.value, tx.data);
                    console.log(`Processing join action from ${tx.from} with value ${tx.value}, index ${tx.index}, and data ${tx.data}`);
                }
            } catch (error) {
                console.warn(`Error processing transaction ${tx.index} from ${tx.from}: ${(error as Error).message}`);
                // Continue with other transactions, don't let this error propagate up
            }
        });

        console.log(`Performing action ${this.action} with index ${this.index} data ${this.data}`);
        game.performAction(this.from, this.action, this.index, this.amount, this.data);

        const nonce = BigInt(this.nonce);

        const _to = this.action === NonPlayerActionType.LEAVE ? this.from : this.to;
        const _from = this.action === NonPlayerActionType.LEAVE ? this.to : this.from;

        // Create transaction with correct direction of funds flow
        // For all other actions: regular format
        const tx: Transaction = await Transaction.create(
            _to, // game receives funds (to)
            _from, // player sends funds (from)
            this.amount,
            nonce,
            this.privateKey,
            `${this.action},${this.index},${this.data}`
        );

        await this.mempool.add(tx);

        if (this.action === NonPlayerActionType.LEAVE) {
            const actionTx = await Transaction.create(
                _to, // game address
                _from, // player address
                this.amount,
                nonce + 1n, // Increment nonce for action transaction
                this.privateKey,
                `${this.action},${this.index}` // Action data
            );

            await this.mempool.add(actionTx);
        }

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

    private async isGameTransaction(address: string): Promise<Boolean> {
        console.log(`Checking if ${address} is a game transaction...`);
        const existingContractSchema = await contractSchemas.findOne({ address: address });

        console.log(`Contract schema found:`, existingContractSchema);
        const found: Boolean = existingContractSchema !== null;

        console.log(`Is game transaction: ${found}`);
        return found;
    }

    private castToOrderedTransaction(tx: Transaction): OrderedTransaction {
        if (!tx.data) {
            throw new Error("Transaction data is undefined");
        }

        const params = tx.data.split(",");
        const action = params[0].trim() as PlayerActionType | NonPlayerActionType;
        const index = parseInt(params[1].trim());

        return {
            from: tx.from,
            to: tx.to,
            value: tx.value,
            type: action,
            index: index,
            data: tx.data
        };
    }
}
