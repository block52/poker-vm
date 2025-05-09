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
        private readonly index: number | number[], // Allow array for join actions with seat number
        private readonly amount: bigint,
        private readonly action: PlayerActionType | NonPlayerActionType,
        private readonly nonce: number,
        private readonly privateKey: string
    ) {
        console.log(`Creating PerformActionCommand: from=${from}, to=${to}, amount=${amount}, data=${action}`);
        this.gameManagement = getGameManagementInstance();
        this.contractSchemas = getContractSchemaManagement();
        this.mempool = getMempoolInstance();
        
        // Debug logging to see what we're getting in the constructor
        const indexType = Array.isArray(this.index) ? 'array' : 'number';
        console.log(`PerformActionCommand created with action=${action}, index=${JSON.stringify(this.index)} (${indexType})`);
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
                // Pass seat number if it exists for join actions
                if (tx.type === NonPlayerActionType.JOIN && tx.seatNumber !== undefined) {
                    game.performAction(tx.from, tx.type, tx.index, tx.value, tx.seatNumber);
                    console.log(`Processing join action from ${tx.from} with value ${tx.value}, index ${tx.index}, and seat ${tx.seatNumber}`);
                } else {
                    game.performAction(tx.from, tx.type, tx.index, tx.value);
                    console.log(`Processing action ${tx.type} from ${tx.from} with value ${tx.value} and index ${tx.index}`);
                }
            } catch (error) {
                console.warn(`Error processing transaction ${tx.index} from ${tx.from}: ${(error as Error).message}`);
                // Continue with other transactions, don't let this error propagate up
            }
        });

        // Perform the current action
        // Check for seat number in join actions 
        let actionIndex = this.index;
        let seatNumber = undefined;
        
        // TODO: Migration - This handles the new format of passing seat numbers for join actions.
        // The seat number is passed as the second element in the index array: [actionIndex, seatNumber]
        // If we need a more generic solution in the future, consider moving to a proper data structure.
        if (this.action === NonPlayerActionType.JOIN && Array.isArray(this.index)) {
            console.log(`Join action with seat specification: ${JSON.stringify(this.index)}`);
            // Extract actionIndex and seatNumber from the array
            if (this.index.length >= 2) {
                [actionIndex, seatNumber] = this.index;
                actionIndex = Number(actionIndex);
                seatNumber = Number(seatNumber);
                console.log(`Extracted action index: ${actionIndex}, seat number: ${seatNumber}`);
            } else {
                // Backward compatibility - if only one element, treat it as actionIndex
                actionIndex = Number(this.index[0]);
                console.log(`Join action with only action index: ${actionIndex}`);
            }
        } else {
            // For non-join actions or when index is not an array
            actionIndex = Number(this.index);
        }

        // Add warning if the actionIndex is NaN to help debugging
        if (isNaN(actionIndex)) {
            console.warn(`WARNING: Action index is NaN. Original value: ${JSON.stringify(this.index)}`);
        }

        console.log(`Performing action ${this.action} with index ${actionIndex}${seatNumber !== undefined ? `, seat ${seatNumber}` : ''}`);
        game.performAction(this.from, this.action, actionIndex, this.amount, seatNumber);

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
                `${this.action},${actionIndex}`
            );
            await this.mempool.add(actionTx);
            
            // 2. Create a transfer transaction to return funds from game to player
            tx = await Transaction.create(
                this.from, // player receives funds (to)
                this.to, // game sends funds (from)
                this.amount, // Return the player's remaining stack
                nonce + 1n, // Increment nonce for second transaction
                this.privateKey,
                `transfer,${actionIndex}`
            );
            await this.mempool.add(tx);
        } else if (this.action === 'join' && seatNumber !== undefined) {
            // For JOIN with seat number: Include the seat number in the transaction data
            tx = await Transaction.create(
                this.to, // game receives funds (to)
                this.from, // player sends funds (from)
                this.amount,
                nonce,
                this.privateKey,
                `${this.action},${actionIndex},${seatNumber}` // Include seat number
            );
            await this.mempool.add(tx);
        } else {
            // For all other actions: regular format
            tx = await Transaction.create(
                this.to, // game receives funds (to)
                this.from, // player sends funds (from)
                this.amount,
                nonce,
                this.privateKey,
                `${this.action},${actionIndex}`
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

        // Split and extract main components from transaction data
        const [rawAction, rawIndex, rawSeat, ...extraParams] = tx.data.split(",");
        
        if (!rawAction || !rawIndex) {
            throw new Error(`Transaction ${tx.hash} has invalid format: "${tx.data}"`);
        }
        
        // Parse action
        const action = rawAction.trim() as PlayerActionType | NonPlayerActionType;
        
        // Parse and validate index
        const index = Number(rawIndex.trim());
        if (Number.isNaN(index)) {
            throw new Error(`Invalid index "${rawIndex}" in transaction ${tx.hash}`);
        }
        
        // Parse seat number only for join actions
        let seatNumber: number | undefined = undefined;
        if (action === NonPlayerActionType.JOIN && rawSeat) {
            seatNumber = Number(rawSeat.trim());
            if (Number.isNaN(seatNumber)) {
                throw new Error(`Invalid seat number "${rawSeat}" in join transaction ${tx.hash}`);
            }
            console.log(`Found join action with valid seat number: ${seatNumber}`);
        }

        return {
            from: tx.from,
            to: tx.to,
            value: tx.value,
            type: action,
            index: index, 
            seatNumber: seatNumber
        };
    }
}
