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

            const mempoolTransactions: Transaction[] = this.mempool.findAll(tx => tx.to === this.address);
            console.log(`Found ${mempoolTransactions.length} mempool transactions`);

            mempoolTransactions.forEach(tx => {
                try {
                    // // For join actions, check if player is already in the game
                    // if (tx.data === "join" && playerSeats.has(tx.from)) {
                    //     console.log(`Skipping join for already seated player: ${tx.from}`);
                    //     return;
                    // }

                    switch (tx.data) {
                        case "bet":
                            game.performAction(tx.from, PlayerActionType.BET, tx.value);
                            break;
                        case "call":
                            game.performAction(tx.from, PlayerActionType.CALL, tx.value);
                            break;
                        case "fold":
                            game.performAction(tx.from, PlayerActionType.FOLD, 0n);
                            break;
                        case "check":
                            game.performAction(tx.from, PlayerActionType.CHECK, 0n);
                            break;
                        case "raise":
                            game.performAction(tx.from, PlayerActionType.RAISE, tx.value);
                            break;
                        case "post small blind":
                            game.performAction(tx.from, PlayerActionType.SMALL_BLIND, tx.value);
                            break;
                        case "post big blind":
                            game.performAction(tx.from, PlayerActionType.BIG_BLIND, tx.value);
                            break;
                        case "deal":
                            console.log(`Processing deal action from ${tx.from}`);
                            try {
                                game.deal();
                            } catch (error) {
                                console.error("Error dealing cards:", error);
                                // Don't rethrow the error - continue processing other actions
                            }
                            break;
                        default:
                            throw new Error("Invalid action");
                    };
                } catch (error) {
                    console.warn(`Error processing transaction ${tx.data} from ${tx.from}: ${(error as Error).message}`);
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
}
