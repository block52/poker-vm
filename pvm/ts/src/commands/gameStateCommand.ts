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

            orderedTransactions.forEach(tx => {
                try {
                    game.performAction(tx.from, tx.type, tx.index, tx.value);
                    console.log(`Processing action ${tx.type} from ${tx.from} with value ${tx.value} and index ${tx.index}`);
                    // // For join actions, check if player is already in the game
                    // if (tx.data === "join" && playerSeats.has(tx.from)) {
                    //     console.log(`Skipping join for already seated player: ${tx.from}`);
                    //     return;
                    // }

                    // switch (tx.data) {
                    //     case "deal":
                    //         console.log(`Processing deal action from ${tx.from}`);
                    //         try {
                    //             game.deal();
                    //         } catch (error) {
                    //             console.error("Error dealing cards:", error);
                    //             // Don't rethrow the error - continue processing other actions
                    //         }
                    //         break;
                    //     default:
                    //         throw new Error("Invalid action");
                    // };
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

        const params = tx.data.split("-");
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
