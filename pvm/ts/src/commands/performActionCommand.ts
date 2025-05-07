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

    constructor(private readonly from: string, private readonly to: string, private readonly index: number, private readonly amount: bigint, private readonly action: PlayerActionType | NonPlayerActionType, private readonly nonce: number, private readonly privateKey: string, private readonly data?: any) {
        // Log the original data parameter which may contain both action index and seat information
        // Data format is typically "actionIndex,seatNumber" where:
        // - Position 0: action index
        // - Position 1: seat number (for JOIN actions)
        console.log(`Creating PerformActionCommand: from=${from}, to=${to}, amount=${amount}, action=${action}, data=${data}`);
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

        console.log(`Processing game transaction: action=${this.action}, to=${this.to}, data=${JSON.stringify(this.data)}`);

        const [json, gameOptions] = await Promise.all([
            this.gameManagement.get(this.to),
            this.contractSchemas.getGameOptions(this.to)
        ]);

        const game: TexasHoldemGame = TexasHoldemGame.fromJson(json, gameOptions);

        // Get mempool transactions for the game
        const mempoolTransactions: Transaction[] = this.mempool.findAll(tx => tx.to === this.to && tx.data !== undefined);
        console.log(`Found ${mempoolTransactions.length} mempool transactions`);

        // Sort transactions by index
        const orderedTransactions = mempoolTransactions.map(tx => this.castToOrderedTransaction(tx))
            .sort((a, b) => a.index - b.index);

        // Process mempool transactions to update game state
        for (const tx of orderedTransactions) {
            try {
                // Handle JOIN actions with special data format
                if (tx.type === NonPlayerActionType.JOIN && tx.data) {
                    console.log(`Processing mempool JOIN action: ${tx.type} from ${tx.from} with value ${tx.value} and data ${tx.data}`);
                    game.performAction(tx.from, tx.type, tx.index, tx.value, tx.data);
                } else {
                    console.log(`Processing mempool action: ${tx.type} from ${tx.from} with value ${tx.value} and index ${tx.index}`);
                    game.performAction(tx.from, tx.type, tx.index, tx.value);
                }
            } catch (error) {
                console.warn(`Error processing transaction ${tx.index} from ${tx.from}: ${(error as Error).message}`);
                // Continue with other transactions, don't let this error propagate up
            }
        }

        // Get the current turn index AFTER processing mempool transactions
        const currentTurnIndex = game.getTurnIndex();
        console.log(`Current turn index after processing mempool transactions: ${currentTurnIndex}`);
        
        // Only override the index if this is not a JOIN action (JOIN actions always use index 0)
        const actionIndex = this.action === NonPlayerActionType.JOIN ? this.index : currentTurnIndex;
        
        console.log(`Performing action ${this.action} with index ${actionIndex} (original index: ${this.index})`);

        // For JOIN action, this.data contains both index and seat as a string: "index,seat"
        // Make sure to pass this.data to ensure the seat information is available
        if (this.action === NonPlayerActionType.JOIN) {
            game.performAction(this.from, this.action, this.index, this.amount, this.data);
        } else {
            game.performAction(this.from, this.action, actionIndex, this.amount, this.data);
        }

        const nonce = BigInt(this.nonce);
        
        // For JOIN actions with seat selection, preserve the seat number in transaction data
        let transactionData;
        if (this.action === NonPlayerActionType.JOIN && this.data && typeof this.data === 'string') {
            // Keep the original data format which includes seat information (e.g. "0,2")
            transactionData = this.data;
            console.log(`Creating JOIN transaction with seat data: ${transactionData}`);
        } else {
            // For other actions, use the format "action,index" with the CURRENT turn index
            transactionData = `${this.action},${actionIndex}`;
            console.log(`Creating standard transaction with data: ${transactionData}`);
        }
        
        const tx: Transaction = await Transaction.create(
            this.to, 
            this.from, 
            this.amount, 
            nonce, 
            this.privateKey, 
            transactionData
        );
        
        await this.mempool.add(tx);
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
        
        // Handle special case for JOIN actions in format "0,2" or "join,2"
        if ((params[0] === "join" || (params.length >= 2 && !isNaN(Number(params[0])))) && params.length >= 2) {
            const action = NonPlayerActionType.JOIN;
            const index = params[0] === "join" ? 0 : Number(params[0]);
            
            return {
                from: tx.from,
                to: tx.to,
                value: tx.value,
                type: action,
                index: index,
                data: tx.data // Keep original data for JOIN actions
            };
        }
        
        // Standard action format: "action,index"
        try {
            const action = params[0].trim() as PlayerActionType | NonPlayerActionType;
            const index = parseInt(params[1].trim());
            
            if (isNaN(index)) {
                console.warn(`Invalid index in transaction data: ${tx.data}`);
                return {
                    from: tx.from,
                    to: tx.to,
                    value: tx.value,
                    type: action,
                    index: 0, // Default to 0 if parsing fails
                    data: undefined
                };
            }

            return {
                from: tx.from,
                to: tx.to,
                value: tx.value,
                type: action,
                index: index,
                data: action === NonPlayerActionType.JOIN ? tx.data : undefined
            };
        } catch (error) {
            console.error(`Error parsing transaction data: ${tx.data}`, error);
            throw new Error(`Invalid transaction data format: ${tx.data}`);
        }
    }
}
