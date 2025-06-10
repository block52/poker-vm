import { TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { getGameManagementInstance } from "../state/index";
import TexasHoldemGame from "../engine/texasHoldem";
import { IGameManagement } from "../state/interfaces";
import { toOrderedTransaction } from "../utils/parsers";
import { PlayerActionType } from "@bitcoinbrisbane/block52";

export class GameStateCommand implements ISignedCommand<TexasHoldemStateDTO> {
    private readonly gameManagement: IGameManagement;
    private readonly mempool: Mempool;

    // This will be shared secret later
    constructor(readonly address: string, private readonly privateKey: string, private readonly caller?: string | undefined) {
        this.gameManagement = getGameManagementInstance();
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<TexasHoldemStateDTO>> {
        try {
            const gameState = await this.gameManagement.getByAddress(this.address);

            if (!gameState) {
                throw new Error(`Game state not found for address: ${this.address}`);
            }

            const game = TexasHoldemGame.fromJson(gameState.state, gameState.gameOptions);
            const mempoolTransactions: Transaction[] = this.mempool.findAll(tx => tx.to === this.address && tx.data !== undefined);
            console.log(`Found ${mempoolTransactions.length} mempool transactions`);

            const orderedTransactions = mempoolTransactions.map(tx => toOrderedTransaction(tx)).sort((a, b) => a.index - b.index);

            orderedTransactions.forEach(tx => {
                try {
                    // CRITICAL FIX: For poker actions, extract amount from transaction data
                    // 
                    // WHY THIS IS NEEDED:
                    // - Poker actions have tx.value = 0 to prevent double deduction from account balance
                    // - The actual bet amount is stored in tx.data (e.g., "bet,11,50000000000000000")
                    // - Without this fix, all poker actions would have amount = 0 and stacks wouldn't decrement
                    // - JOIN/TOPUP actions still use tx.value because they transfer funds from account to table
                    let actionAmount = tx.value;
                    let actionData = tx.data;
                    
                    if ((tx.type === PlayerActionType.BET || 
                         tx.type === PlayerActionType.RAISE || 
                         tx.type === PlayerActionType.CALL) && 
                        tx.data && !isNaN(Number(tx.data))) {
                        // Amount is encoded in data for poker actions
                        actionAmount = BigInt(tx.data);
                        actionData = null;
                    }
                    
                    game.performAction(tx.from, tx.type, tx.index, actionAmount, actionData);
                } catch (error) {
                    console.warn(`Error processing transaction ${tx.index} from ${tx.from}: ${(error as Error).message}`);
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
}
