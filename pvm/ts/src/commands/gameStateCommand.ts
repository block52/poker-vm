import { PlayerActionType, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import TexasHoldemGame from "../engine/texasHoldem";
import { GameManagement } from "../state/gameManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { ContractSchemaManagement, getContractSchemaManagement } from "../state/contractSchemaManagement";
import { Transaction } from "../models";


type OrderedTransaction = {
    from: string;
    to: string;
    value: bigint;
    type: PlayerActionType;
    index: number;
};

export class GameStateCommand implements ISignedCommand<TexasHoldemStateDTO> {
    private readonly gameManagement: GameManagement;
    private readonly mempool: Mempool;
    private readonly contractSchemaManagement: ContractSchemaManagement;

    constructor(readonly address: string, private readonly privateKey: string) {
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

            const game = TexasHoldemGame.fromJson(json, gameOptions);
            const mempoolTransactions: Transaction[] = this.mempool.findAll(tx => tx.to === this.address && tx.data !== undefined);
            console.log(`Found ${mempoolTransactions.length} mempool transactions`);

            const orderedTransactions = mempoolTransactions.map(tx => this.castToOrderedTransaction(tx))
                .sort((a, b) => a.index - b.index);

            // Create a set to track processed actions and prevent duplicates
            const processedActions = new Set<string>();
            console.log(`Processing ${orderedTransactions.length} ordered transactions`);
            
            orderedTransactions.forEach(tx => {
                try {
                    // Create a unique key using normalized (lowercase) address to avoid case sensitivity issues
                    const actionKey = `${tx.from.toLowerCase()}-${tx.type}-${tx.index}`;
                    
                    // Check if we've already processed an identical action
                    if (processedActions.has(actionKey)) {
                        console.log(`Skipping duplicate action: ${actionKey}`);
                        return; // Skip this action if it's a duplicate
                    }
                    
                    // Add to processed set before executing to prevent duplicates
                    processedActions.add(actionKey);
                    console.log(`Added action to processed set: ${actionKey}`);
                    
                    // Execute the action
                    game.performAction(tx.from, tx.type, tx.index, tx.value);
                    console.log(`Processing action ${tx.type} from ${tx.from} with value ${tx.value} and index ${tx.index}`);
                } catch (error) {
                    console.warn(`Error processing transaction ${tx.index} from ${tx.from}: ${(error as Error).message}`);
                    // Continue with other transactions, don't let this error propagate up
                }
            });

            // update game state
            const state = game.toJson();

            return await signResult(state, this.privateKey);
        } catch (error) {
            console.error("Error in GameStateCommand:", error);

            // Return the original state without changes instead of throwing an error
            const originalState = await this.gameManagement.get(this.address);
            return await signResult(originalState, this.privateKey);
        }
    }

    private castToOrderedTransaction(tx: Transaction): OrderedTransaction {
        if (!tx.data) {
            throw new Error("Transaction data is undefined");
        }

        // Use the parser to handle both old and new formats
        const { action, index } = TexasHoldemGame.parseTransactionData(tx.data);

        // Return with normalized address to avoid case sensitivity issues
        return {
            from: tx.from.toLowerCase(), // Normalize to lowercase
            to: tx.to.toLowerCase(),     // Normalize to lowercase
            value: tx.value,
            type: action as PlayerActionType,
            index: index
        };
    }
}
