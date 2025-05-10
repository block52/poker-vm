import { PlayerActionType, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
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
                    game.performAction(tx.from, tx.type, tx.index, tx.value);
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

    // Deprecated: use toOrderedTransaction instead
    private castToOrderedTransaction(tx: Transaction): OrderedTransaction {
        if (!tx.data) {
            throw new Error("Transaction data is undefined");
        }

        const params = tx.data.split(",");
        const action = params[0].trim() as PlayerActionType;
        const index = parseInt(params[1].trim());

        return {
            from: tx.from,
            to: tx.to,
            value: tx.value,
            type: action,
            index: index
        };
    }
}
