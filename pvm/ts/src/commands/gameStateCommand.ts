import { NonPlayerActionType, PlayerActionType, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import TexasHoldemGame from "../engine/texasHoldem";
import { GameManagement } from "../state/gameManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { ContractSchemaManagement, getContractSchemaManagement } from "../state/contractSchemaManagement";
import { Transaction } from "../models";
import { OrderedTransaction } from "../engine/types";


export class GameStateCommand implements ISignedCommand<TexasHoldemStateDTO> {
    private readonly gameManagement: GameManagement;
    private readonly mempool: Mempool;
    private readonly contractSchemaManagement: ContractSchemaManagement;

    // This will be shared secret later
    constructor(readonly address: string, private readonly privateKey: string, private readonly caller?: string | undefined) {
        this.gameManagement = new GameManagement();
        this.mempool = getMempoolInstance();
        this.contractSchemaManagement = getContractSchemaManagement();
    }

    public async execute(): Promise<ISignedResponse<TexasHoldemStateDTO>> {
        try {
            const [json, gameOptions] = await Promise.all([
                this.gameManagement.get(this.address),
                this.contractSchemaManagement.getGameOptions(this.address)
            ]);

            if (!json) {
                throw new Error(`Game state not found for address: ${this.address}`);
            }

            // Get the games view with respect to the caller (shared secret)
            const game = TexasHoldemGame.fromJson(json, gameOptions);
            const mempoolTransactions: Transaction[] = this.mempool.findAll(tx => tx.to === this.address && tx.data !== undefined);
            console.log(`Found ${mempoolTransactions.length} mempool transactions`);

            // Sort transactions by index to ensure they're processed in the correct order
            const orderedTransactions = mempoolTransactions.map(tx => this.castToOrderedTransaction(tx))
                .sort((a, b) => a.index - b.index);

            // Process all mempool transactions first to update the game state
            let processedAtLeastOne = false;
            for (const tx of orderedTransactions) {
                try {
                    // For JOIN actions, pass the original data string which includes seat information
                    if (tx.type === NonPlayerActionType.JOIN) {
                        console.log(`Processing JOIN action with data: ${tx.data}`);
                        game.performAction(tx.from, tx.type, tx.index, tx.value, tx.data);
                    } else {
                        game.performAction(tx.from, tx.type, tx.index, tx.value);
                    }
                    console.log(`Processed action ${tx.type} from ${tx.from} with value ${tx.value} and index ${tx.index}`);
                    processedAtLeastOne = true;
                } catch (error) {
                    console.warn(`Error processing transaction ${tx.index} from ${tx.from}: ${(error as Error).message}`);
                    // Continue with other transactions, don't let this error propagate up
                }
            }

            // If we processed any transactions, log the current turn index
            if (processedAtLeastOne) {
                console.log(`Current turn index after processing mempool transactions: ${game.getTurnIndex()}`);
            }

            // update game state
            const state = game.toJson(this.caller);
            
            // Add the current turn index to the response for debugging
            const debugInfo = { 
                currentTurnIndex: game.getTurnIndex() 
            };
            console.log(`Returning game state with turn index: ${debugInfo.currentTurnIndex}`);

            return await signResult(state, this.privateKey);
        } catch (error) {
            console.error(`Error executing GameStateCommand: ${(error as Error).message}`);
            throw error; // Rethrow the error to be handled by the caller
        }
    }

    /**
     * Converts a Transaction from the mempool into an OrderedTransaction
     * 
     * IMPORTANT: For JOIN actions, we need to preserve the original data parameter
     * which contains both action index and seat selection information.
     * 
     * Transaction data format can be:
     * - "action,index" for regular actions
     * - "0,seatNumber" for JOIN actions from client
     * - "join,seatNumber" for JOIN actions from mempool
     */
    private castToOrderedTransaction(tx: Transaction): OrderedTransaction {
        if (!tx.data) {
            throw new Error("Transaction data is undefined");
        }

        // Split the data string to extract action type, index, and potential seat number
        const parts = tx.data.split(",");
        let action: PlayerActionType | NonPlayerActionType;
        let index: number;
        
        // Check if this is a JOIN transaction with seat info
        if (parts[0] === "join" && parts.length > 1) {
            // This is a JOIN transaction from mempool
            action = NonPlayerActionType.JOIN;
            // For JOIN transactions, we use a fixed index of 0
            index = 0;
            
            // Extract the seat number for passing to performAction
            const seatNumber = Number(parts[1].trim());
            if (!isNaN(seatNumber)) {
                console.log(`Found JOIN transaction with seat ${seatNumber} for ${tx.from}`);
                
                // For JOIN actions, pass the raw data to preserve seat information
                return {
                    from: tx.from,
                    to: tx.to,
                    value: tx.value,
                    type: action, 
                    index: index,
                    data: tx.data // Keep the original data for JOIN actions
                };
            }
        } else if (parts.length >= 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
            // This looks like "0,2" format from client for JOIN
            action = NonPlayerActionType.JOIN;
            index = Number(parts[0]); // Use the actual index from the data
            
            console.log(`Found JOIN transaction with client format data: ${tx.data} for ${tx.from}`);
            return {
                from: tx.from,
                to: tx.to,
                value: tx.value,
                type: action,
                index: index,
                data: tx.data // Keep the original client format data
            };
        } else {
            // Standard action format: "action,index"
            try {
                action = parts[0].trim() as PlayerActionType | NonPlayerActionType;
                index = parseInt(parts[1].trim());
                
                // Log extracted action and index for debugging
                console.log(`Parsed standard action: ${action}, index: ${index}`);
                
                if (isNaN(index)) {
                    console.warn(`Invalid index in transaction data: ${tx.data}`);
                    index = 0; // Default to 0 if parsing fails
                }
            } catch (error) {
                console.error(`Error parsing transaction data: ${tx.data}`, error);
                throw new Error(`Invalid transaction data format: ${tx.data}`);
            }
        }

        return {
            from: tx.from,
            to: tx.to,
            value: tx.value,
            type: action,
            index: index,
            data: action === NonPlayerActionType.JOIN ? tx.data : undefined // Only include data for JOIN actions
        };
    }
}
