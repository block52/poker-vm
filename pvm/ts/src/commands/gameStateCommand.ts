import {  PlayerActionType, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import TexasHoldemGame from "../engine/texasHoldem";
import { GameManagement } from "../state/gameManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { ContractSchema } from "../models/contractSchema";

export class GameStateCommand implements ISignedCommand<TexasHoldemStateDTO> {
    private readonly gameManagement: GameManagement;
    private readonly mempool: Mempool;

    constructor(readonly address: string, private readonly privateKey: string) {
        this.gameManagement = new GameManagement();
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<TexasHoldemStateDTO>> {
        try {
            const [json, gameOptions] = await Promise.all([
                this.gameManagement.get(this.address),
                ContractSchema.getGameOptions(this.address)
            ]);

            const game = TexasHoldemGame.fromJson(json, gameOptions);

            // Track players who are already in the game to avoid duplicate joins
            const playerSeats = new Map<string, number>();
            const currentState = game.toJson();
            
            // Initialize player seats from the current game state
            for (const player of currentState.players) {
                if (player.address && player.address !== "0x0000000000000000000000000000000000000000") {
                    playerSeats.set(player.address, player.seat);
                    console.log(`Found existing player ${player.address} at seat ${player.seat}`);
                }
            }

            const mempoolTransactions = this.mempool.findAll(tx => tx.to === this.address);
            console.log(`Found ${mempoolTransactions.length} mempool transactions`);

            // // Get all transactions from the chain
            // const minedTransactions = await this.transactionManagement.getTransactionsByAddress(this.address);
            // console.log(`Mined transactions: ${minedTransactions.length}`);

            // // Get all transactions from mempool and replay them
            // const allTransactions = [...minedTransactions, ...mempoolTransactions];

            mempoolTransactions.forEach(tx => {
                try {
                    // For join actions, check if player is already in the game
                    if (tx.data === "join" && playerSeats.has(tx.from)) {
                        console.log(`Skipping join for already seated player: ${tx.from}`);
                        return;
                    }
                    
                    switch (tx.data) {
                        case "join":
                            try {
                                game.join2(tx.from, tx.value);
                                // Update player seat tracking after successful join
                                const seat = game.getPlayerSeatNumber(tx.from);
                                playerSeats.set(tx.from, seat);
                            } catch (error) {
                                // Special handling for join errors - don't throw
                                if ((error as Error).message.includes("Player already joined")) {
                                    console.warn(`Player ${tx.from} already joined the game, skipping join action`);
                                } else {
                                    throw error;
                                }
                            }
                            break;
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
            // console.log("Updated game state:", state);

            return await signResult(state, this.privateKey);
        } catch (error) {
            console.error("Error in GameStateCommand:", error);
            
            // Return the original state without changes instead of throwing an error
            const originalState = await this.gameManagement.get(this.address);
            return await signResult(originalState, this.privateKey);
        }
    }
}
