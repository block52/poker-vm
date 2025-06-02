import {  GameOptions, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import TexasHoldemGame from "../engine/texasHoldem";
import { getGameManagementInstance, getContractSchemaManagementInstance } from "../state/index";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { Transaction } from "../models";
import { IContractSchemaManagement, IGameManagement } from "../state/interfaces";
import { toOrderedTransaction } from "../utils/parsers";

export class GameStateCommand implements ISignedCommand<TexasHoldemStateDTO> {
    private readonly gameManagement: IGameManagement;
    private readonly mempool: Mempool;
    private readonly contractSchemaManagement: IContractSchemaManagement;

    // This will be shared secret later
    constructor(readonly address: string, private readonly privateKey: string, private readonly caller?: string | undefined) {
        this.gameManagement = getGameManagementInstance();
        this.contractSchemaManagement = getContractSchemaManagementInstance();
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<TexasHoldemStateDTO>> {
        try {
            const gameState = await this.gameManagement.getByAddress(this.address);

            if (!gameState) {
                throw new Error(`Game state not found for address: ${this.address}`);
            }

            const gameOptions: GameOptions = await this.contractSchemaManagement.getGameOptions(gameState.schemaAddress);
            const game = TexasHoldemGame.fromJson(gameState.state, gameOptions);
            const mempoolTransactions: Transaction[] = this.mempool.findAll(tx => tx.to === this.address && tx.data !== undefined);
            console.log(`Found ${mempoolTransactions.length} mempool transactions`);

            const orderedTransactions = mempoolTransactions.map(tx => toOrderedTransaction(tx)).sort((a, b) => a.index - b.index);

            orderedTransactions.forEach(tx => {
                try {
                    game.performAction(tx.from, tx.type, tx.index, tx.value, tx.data);
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
