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
        console.log("Executing transfer command...");

        if (await !this.isGameTransaction(this.to)) {
            console.log(`Not a game transaction, checking if ${this.to} is a game...`);
            throw new Error("Not a game transaction");
        }

        console.log(`Processing game transaction: data=${this.action}, to=${this.to}`);

        const [json, gameOptions] = await Promise.all([
            this.gameManagement.get(this.to),
            this.contractSchemas.getGameOptions(this.to)
        ]);

        const game: TexasHoldemGame = TexasHoldemGame.fromJson(json, gameOptions);
        
        if (!this.isActionLegal(game)) {
            throw new Error(`Action ${this.action} is not legal for player ${this.from} with index ${this.index}`);
        }
        
        console.log(`Adding action ${this.action} with index ${this.index} to mempool`);
        const tx: Transaction = await Transaction.create(this.to, this.from, this.amount, 0n, this.privateKey, `${this.action}-${this.index}`);
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

    private isActionLegal(game: TexasHoldemGame): boolean {
        try {
            if (this.action === NonPlayerActionType.JOIN || this.action === NonPlayerActionType.LEAVE) {
                return true;
            }
            
            if (!game.exists(this.from)) {
                console.log(`Player ${this.from} does not exist in game ${this.to}`);
                return false;
            }
            
            if (this.index !== game.currentTurnIndex()) {
                console.log(`Invalid index: expected ${game.currentTurnIndex()}, got ${this.index}`);
                return false;
            }
            
            const legalActions = game.getLegalActions(this.from);
            const isLegal = legalActions.some(action => action.action === this.action);
            
            console.log(`Action ${this.action} is ${isLegal ? 'legal' : 'not legal'} for player ${this.from}`);
            return isLegal;
        } catch (error) {
            console.error(`Error checking if action is legal: ${error}`);
            return false;
        }
    }
}
