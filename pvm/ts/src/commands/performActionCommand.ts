import { NonPlayerActionType, PlayerActionType } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models";
import { ICommand, ISignedResponse } from "./interfaces";
import { GameManagement, getGameManagementInstance } from "../state/gameManagement";
import contractSchemas from "../schema/contractSchemas";
import { ContractSchemaManagement, getContractSchemaManagement } from "../state/contractSchemaManagement";
import TexasHoldemGame from "../engine/texasHoldem";
import { signResult } from "./abstractSignedCommand";
import { OrderedTransaction } from "../engine/types";

export class PerformActionCommand implements ICommand<ISignedResponse<Transaction>> {
    private readonly gameManagement: GameManagement;
    private readonly contractSchemas: ContractSchemaManagement;
    private readonly mempool: Mempool;

    constructor(
        private readonly from: string,
        private readonly to: string,
        private readonly index: number,
        private readonly amount: bigint,
        private readonly action: PlayerActionType | NonPlayerActionType,
        private readonly nonce: number,
        private readonly privateKey: string
    ) {
        console.log(`Creating PerformActionCommand: from=${from}, to=${to}, amount=${amount}, data=${action}`);
        this.gameManagement = getGameManagementInstance();
        this.contractSchemas = getContractSchemaManagement();
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<Transaction>> {
        console.log("Executing transfer command...");

        if (await !this.isGameTransaction(this.to)) {
            console.log(`Not a game transaction, checking if ${this.to} is a game...`);
            throw new Error("Not a game transaction");
        }

        console.log(`Processing game transaction: data=${this.action}, to=${this.to}`);

        const [json, gameOptions] = await Promise.all([this.gameManagement.get(this.to), this.contractSchemas.getGameOptions(this.to)]);

        const game: TexasHoldemGame = TexasHoldemGame.fromJson(json, gameOptions);

        // Get mempool transactions for the game
        const mempoolTransactions: Transaction[] = this.mempool.findAll(tx => tx.to === this.to && tx.data !== undefined);
        console.log(`Found ${mempoolTransactions.length} mempool transactions`);

        // Sort transactions by index
        const orderedTransactions = mempoolTransactions.map(tx => this.castToOrderedTransaction(tx)).sort((a, b) => a.index - b.index);

        orderedTransactions.forEach(tx => {
            try {
                game.performAction(tx.from, tx.type, tx.index, tx.value);
                console.log(`Processing action ${tx.type} from ${tx.from} with value ${tx.value} and index ${tx.index}`);
            } catch (error) {
                console.warn(`Error processing transaction ${tx.index} from ${tx.from}: ${(error as Error).message}`);
                // Continue with other transactions, don't let this error propagate up
            }
        });

        // Perform the current action
        game.performAction(this.from, this.action, this.index, this.amount);

        const nonce = BigInt(this.nonce);
        
        // Create transaction with correct direction of funds flow  
        // TODO: work out if theis the the best way to process a leave action and also a join action. ticket 553
        let tx: Transaction;
        if (this.action === NonPlayerActionType.LEAVE) {
            // For LEAVE: We need to handle both the game action and the funds transfer
            // 1. Create a transaction for the leave action (added to mempool)
            const actionTx = await Transaction.create(
                this.to, // game address
                this.from, // player address
                0n, // No funds for the action itself
                nonce,
                this.privateKey,
                `${this.action},${this.index}`
            );
            await this.mempool.add(actionTx);
            
            // 2. Create a transfer transaction to return funds from game to player
            tx = await Transaction.create(
                this.from, // player receives funds (to)
                this.to, // game sends funds (from)
                this.amount, // Return the player's remaining stack
                nonce + 1n, // Increment nonce for second transaction
                this.privateKey,
                `transfer,${this.index}`
            );
            await this.mempool.add(tx);
        } else {
            // For all other actions: funds flow from player to game 
            tx = await Transaction.create(
                this.to, // game receives funds (to)
                this.from, // player sends funds (from)
                this.amount,
                nonce,
                this.privateKey,
                `${this.action},${this.index}`
            );
            await this.mempool.add(tx);
        }

        return signResult(tx, this.privateKey);
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
        const action = params[0].trim() as PlayerActionType;
        const index = parseInt(params[1].trim());

        return {
            from: tx.from,
            to: tx.to,
            value: tx.value,
            type: action,
            index: index
        };
    }
}
