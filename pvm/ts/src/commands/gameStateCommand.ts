import { PlayerActionType, TexasHoldemStateDTO, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import TexasHoldemGame from "../engine/texasHoldem";
import { GameManagement } from "../state/gameManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { getContractSchemaManagement } from "../state/index";
import { Transaction } from "../models";
import { OrderedTransaction } from "../engine/types";
import { IContractSchemaManagement, IGameManagement } from "../state/interfaces";

export class GameStateCommand implements ISignedCommand<TexasHoldemStateDTO> {
    private readonly gameManagement: IGameManagement;
    private readonly mempool: Mempool;
    private readonly contractSchemaManagement: IContractSchemaManagement;

    // This will be shared secret later
    constructor(readonly address: string, private readonly privateKey: string, private readonly caller?: string | undefined) {
        this.gameManagement = new GameManagement();
        this.mempool = getMempoolInstance();
        this.contractSchemaManagement = getContractSchemaManagement();
    }

    public async execute(): Promise<ISignedResponse<TexasHoldemStateDTO>> {
        try {
            // Retrieve current game state and options
            const [json, gameOptions] = await Promise.all([
                this.gameManagement.get(this.address), 
                this.contractSchemaManagement.getGameOptions(this.address)
            ]);

            if (!json) {
                throw new Error(`Game state not found for address: ${this.address}`);
            }

            // Get the games view with respect to the caller (shared secret)
            const game = TexasHoldemGame.fromJson(json, gameOptions);
            
            // Find relevant transactions in the mempool for this game
            const mempoolTransactions: Transaction[] = this.mempool.findAll(tx => 
                tx.to === this.address && tx.data !== undefined
            );
            console.log(`Found ${mempoolTransactions.length} mempool transactions for game ${this.address}`);

            // Convert and order transactions
            const orderedTransactions = mempoolTransactions
                .map(tx => this.castToOrderedTransaction(tx))
                .sort((a, b) => a.index - b.index);

            // Log to help with debugging
            if (orderedTransactions.length > 0) {
                console.log(`Processing ${orderedTransactions.length} ordered transactions:`);
                orderedTransactions.forEach(tx => {
                    console.log(`- From: ${tx.from}, Action: ${tx.type}, Index: ${tx.index}, Data: ${tx.data}, Value: ${tx.value?.toString()}`);
                });
            }

            // Apply all pending transactions to the game state
            let appliedCount = 0;
            for (const tx of orderedTransactions) {
                try {
                    // For join actions, extract seat number from the data if possible
                    let dataValue = tx.data;
                    if (tx.type === NonPlayerActionType.JOIN) {
                        // Extract seat number if available
                        const txParams = tx.data?.toString().split(',');
                        if (txParams?.length >= 2) {
                            // Action type and action index already extracted
                            // Any third parameter would be seat number
                            const seatParam = txParams[2];
                            if (seatParam && !isNaN(Number(seatParam))) {
                                dataValue = seatParam; // Use seat number as data
                                console.log(`Extracted seat number ${dataValue} from JOIN transaction data`);
                            }
                        }
                    }
                    
                    // Perform the action on the game state
                    console.log(`Applying transaction ${tx.type} from ${tx.from} with index ${tx.index}, data: ${dataValue}`);
                    game.performAction(tx.from, tx.type, tx.index, tx.value, dataValue);
                    appliedCount++;
                } catch (error) {
                    console.warn(`Error processing transaction ${tx.index} from ${tx.from}: ${(error as Error).message}`);
                }
            }

            if (appliedCount > 0) {
                console.log(`Successfully applied ${appliedCount} transactions to game state`);
                // Save the updated game state back to the database
                try {
                    const updatedState = game.toJson(this.caller);
                    await this.gameManagement.saveFromJSON(updatedState);
                    console.log(`Updated game state saved to database after applying ${appliedCount} transactions`);
                } catch (saveError) {
                    console.error(`Failed to save updated game state: ${(saveError as Error).message}`);
                }
            }

            // Get the final state to return
            const state = game.toJson(this.caller);
            return await signResult(state, this.privateKey);
        } catch (error) {
            console.error(`Error executing GameStateCommand: ${(error as Error).message}`);
            throw error; // Rethrow the error to be handled by the caller
        }
    }

    private castToOrderedTransaction(tx: Transaction): OrderedTransaction {
        if (!tx.data) {
            throw new Error("Transaction data is undefined");
        }

        const params = tx.data.split(",");
        const action = params[0].trim() as PlayerActionType | NonPlayerActionType;
        
        // Parse the second parameter as the action index
        let index = 0;
        if (params.length > 1 && !isNaN(parseInt(params[1].trim()))) {
            index = parseInt(params[1].trim());
        }

        // For debugging
        console.log(`Parsed transaction data: action=${action}, index=${index}, full data=${tx.data}`);

        return {
            from: tx.from,
            to: tx.to,
            value: tx.value,
            type: action,
            index: index,
            data: tx.data // Keep the full data string for further processing
        };
    }
}
