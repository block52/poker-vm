import { NonPlayerActionType, PlayerActionType, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import TexasHoldemGame from "../engine/texasHoldem";
import { GameManagement } from "../state/gameManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { ContractSchemaManagement, getContractSchemaManagement } from "../state/contractSchemaManagement";
import { Transaction } from "../models";
import { OrderedTransaction } from "../engine/types";

// Extended version of OrderedTransaction that includes NonPlayerActionType
interface ExtendedOrderedTransaction extends Omit<OrderedTransaction, 'type'> {
    type: PlayerActionType | NonPlayerActionType;
    seatNumber?: number;
}

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

            const orderedTransactions = mempoolTransactions.map(tx => this.castToOrderedTransaction(tx))
                .sort((a, b) => a.index - b.index);

            orderedTransactions.forEach(tx => {
                try {
                    // Now pass the seat number as the data parameter for JOIN actions
                    if (tx.type === 'join' && tx.seatNumber !== undefined) {
                        console.log(`Reapplying JOIN action with seat ${tx.seatNumber} for ${tx.from}`);
                        game.performAction(tx.from, tx.type as NonPlayerActionType, tx.index, tx.value, tx.seatNumber);
                    } else {
                        game.performAction(tx.from, tx.type, tx.index, tx.value);
                    }
                    console.log(`Processing action ${tx.type} from ${tx.from} with value ${tx.value} and index ${tx.index}`);
                } catch (error) {
                    console.warn(`Error processing transaction ${tx.index} from ${tx.from}: ${(error as Error).message}`);
                    // Continue with other transactions, don't let this error propagate up
                }
            });

            // update game state
            const state = game.toJson(this.caller);

            return await signResult(state, this.privateKey);
        } catch (error) {
            console.error(`Error executing GameStateCommand: ${(error as Error).message}`);
            throw error; // Rethrow the error to be handled by the caller
        }
    }

    /**
     * Converts a Transaction from the mempool into an OrderedTransaction
     * 
     * IMPORTANT: For JOIN actions with seat selection, we need to extract
     * the seat number from the transaction data and include it as part of
     * the ordered transaction so it can be reapplied correctly.
     * 
     * Transaction data format: "action,index" or "action,index,seatNumber" for JOIN
     */
    private castToOrderedTransaction(tx: Transaction): ExtendedOrderedTransaction {
        if (!tx.data) {
            throw new Error("Transaction data is undefined");
        }

        const params = tx.data.split(",");
        const action = params[0].trim() as PlayerActionType | NonPlayerActionType;
        const index = parseInt(params[1].trim());
        
        // Extract seat number for JOIN transactions (format: "join,0,2")
        let seatNumber: number | undefined = undefined;
        if (action === 'join' && params.length > 2) {
            seatNumber = parseInt(params[2].trim());
            console.log(`Found JOIN transaction with seat ${seatNumber} for ${tx.from}`);
        }

        return {
            from: tx.from,
            to: tx.to,
            value: tx.value,
            type: action,
            index: index,
            seatNumber // Include the seat number in the returned object
        };
    }
}
