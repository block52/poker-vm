import { NonPlayerActionType, PlayerActionType } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models";
import { ICommand, ISignedResponse } from "./interfaces";
import { GameManagement, getGameManagementInstance } from "../state/gameManagement";
import contractSchemas from "../schema/contractSchemas";
import { ContractSchemaManagement, getContractSchemaManagement } from "../state/contractSchemaManagement";
import TexasHoldemGame from "../engine/texasHoldem";
import { signResult } from "./abstractSignedCommand";

export class PerformActionCommand implements ICommand<ISignedResponse<Transaction>> {
    private readonly gameManagement: GameManagement;
    private readonly contractSchemas: ContractSchemaManagement;
    private readonly mempool: Mempool;

    constructor(private from: string, private to: string, private index: number, private amount: bigint, private action: PlayerActionType | NonPlayerActionType, private readonly privateKey: string) {
        console.log(`Creating PerformActionCommand: from=${from}, to=${to}, amount=${amount}, data=${action}`);
        this.gameManagement = getGameManagementInstance();
        this.contractSchemas = getContractSchemaManagement();
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<Transaction>> {
        console.log("==== PERFORM ACTION COMMAND EXECUTION START ====");
        console.log(`Player: ${this.from}`);
        console.log(`Table: ${this.to}`);
        console.log(`Action: ${this.action}`);
        console.log(`Index: ${this.index}`);
        console.log(`Amount: ${this.amount}`);

        if (await !this.isGameTransaction(this.to)) {
            console.log(`Not a game transaction, checking if ${this.to} is a game...`);
            throw new Error("Not a game transaction");
        }

        console.log(`Processing game transaction: action=${this.action}, to=${this.to}`);

        const [json, gameOptions] = await Promise.all([
            this.gameManagement.get(this.to),
            this.contractSchemas.getGameOptions(this.to)
        ]);

        console.log("Game state loaded, creating game instance");
        const game: TexasHoldemGame = TexasHoldemGame.fromJson(json, gameOptions);
        console.log(`Game instance created, current round: ${game.currentRound}`);
        
        console.log("Checking if action is legal...");
        if (!this.isActionLegal(game)) {
            console.log("==== ACTION REJECTED: NOT LEGAL ====");
            throw new Error(`Action ${this.action} is not legal for player ${this.from} with index ${this.index}`);
        }
        
        console.log("Action is legal, creating transaction...");
        console.log(`Adding action ${this.action} with index ${this.index} to mempool`);
        const tx: Transaction = await Transaction.create(this.to, this.from, this.amount, 0n, this.privateKey, `${this.action}-${this.index}`);
        console.log("Transaction created, adding to mempool...");
        await this.mempool.add(tx);
        console.log("Transaction added to mempool, signing result...");
        const result = signResult(tx, this.privateKey);
        console.log("==== PERFORM ACTION COMMAND EXECUTION COMPLETE ====");
        return result;
    }

    private async isGameTransaction(address: string): Promise<Boolean> {
        console.log(`Checking if ${address} is a game transaction...`);
        const existingContractSchema = await contractSchemas.findOne({ address: address });

        console.log(`Contract schema found:`, existingContractSchema);
        const found: Boolean = existingContractSchema !== null;

        console.log(`Is game transaction: ${found}`);
        return found;
    }

    private isActionLegal(game: TexasHoldemGame): boolean {
        try {
            console.log(`===== ACTION VERIFICATION START =====`);
            console.log(`Player: ${this.from}`);
            console.log(`Action: ${this.action}`);
            console.log(`Index: ${this.index}`);
            console.log(`Amount: ${this.amount}`);
            
            if (this.action === NonPlayerActionType.JOIN || this.action === NonPlayerActionType.LEAVE) {
                console.log(`JOIN or LEAVE action detected - allowed by default`);
                return true;
            }
            
            if (!game.exists(this.from)) {
                console.log(`Player ${this.from} does not exist in game ${this.to}`);
                return false;
            }
            
            const currentTurnIndex = game.currentTurnIndex();
            console.log(`Current turn index: ${currentTurnIndex}, Requested index: ${this.index}`);
            
            if (this.index !== currentTurnIndex) {
                console.log(`Invalid index: expected ${currentTurnIndex}, got ${this.index}`);
                return false;
            }
            
            const legalActions = game.getLegalActions(this.from);
            console.log(`Legal actions for player ${this.from}:`, legalActions);
            
            const isLegal = legalActions.some(action => action.action === this.action);
            
            console.log(`Action ${this.action} is ${isLegal ? 'LEGAL' : 'NOT LEGAL'} for player ${this.from}`);
            console.log(`===== ACTION VERIFICATION END =====`);
            return isLegal;
        } catch (error) {
            console.error(`===== ERROR IN ACTION VERIFICATION =====`);
            console.error(`Error checking if action is legal: ${error}`);
            console.error(`Player: ${this.from}, Action: ${this.action}, Index: ${this.index}`);
            console.error(`===== END ERROR IN ACTION VERIFICATION =====`);
            return false;
        }
    }
}
