// import { GameOptions, PlayerActionType } from "@bitcoinbrisbane/block52";
// import { getMempoolInstance, Mempool } from "../core/mempool";
// import { Transaction } from "../models";
// import { signResult } from "./abstractSignedCommand";
// import { ICommand, ISignedResponse } from "./interfaces";
// import { GameManagement, getGameManagementInstance } from "../state/gameManagement";
// import TexasHoldemGame from "../engine/texasHoldem";
// import { AccountCommand } from "./accountCommand";
// import contractSchemas from "../schema/contractSchemas";
// import { ContractSchemaManagement, getContractSchemaManagement } from "../state/contractSchemaManagement";

// export class PerformActionCommand implements ICommand<ISignedResponse<Transaction>> {
//     private readonly gameManagement: GameManagement;
//     private readonly contractSchemas: ContractSchemaManagement;
//     private readonly mempool: Mempool;

//     constructor(private from: string, private to: string, private amount: bigint, private data: string, private readonly privateKey: string) {
//         console.log(`Creating PerformActionCommand: from=${from}, to=${to}, amount=${amount}, data=${data}`);
//         this.gameManagement = getGameManagementInstance();
//         this.contractSchemas = getContractSchemaManagement();
//         this.mempool = getMempoolInstance();
//     }

//     public async execute(): Promise<ISignedResponse<Transaction>> {
//         console.log("Executing transfer command...");

//         if (await !this.isGameTransaction(this.to)) {
//             console.log(`Not a game transaction, checking if ${this.to} is a game...`);
//         }

//         // const playerAction = this.data as PlayerActionType;


//         //         console.log(`Processing game transaction: data=${this.data}, to=${this.to}`);

//         //         const [json, gameOptions] = await Promise.all([
//         //             this.gameManagement.get(this.to),
//         //             this.contractSchemas.getGameOptions(this.to)
//         //         ]);

//         //         const game: TexasHoldemGame = TexasHoldemGame.fromJson(json, gameOptions);
//         //         // Replay tx from mempool

//         //         // Cast string to PlayerActionType

//         //         console.log(`Player action type: ${playerAction}`);

//         //         switch (playerAction) {
//         //             case "join":
//         //                 console.log(`Player ${this.from} joining game with ${this.amount} chips...`);
//         //                 game.join(this.from, this.amount);
//         //                 console.log(`Join successful`);
//         //                 break;
//         //             case "post small blind":
//         //                 game.performAction(this.from, PlayerActionType.SMALL_BLIND, this.amount);
//         //                 break;
//         //             case "post big blind":
//         //                 game.performAction(this.from, PlayerActionType.BIG_BLIND, this.amount);
//         //                 break;
//         //             case "bet":
//         //                 console.log(`Player ${this.from} betting ${this.amount}...`);
//         //                 game.performAction(this.from, PlayerActionType.BET, this.amount);
//         //                 break;
//         //             case "call":
//         //                 game.performAction(this.from, PlayerActionType.CALL);
//         //                 break;
//         //             case "fold":
//         //                 game.performAction(this.from, PlayerActionType.FOLD);
//         //                 break;
//         //             case "check":
//         //                 game.performAction(this.from, PlayerActionType.CHECK);
//         //                 break;
//         //             case "raise":
//         //                 console.log(`Player ${this.from} raising to ${this.amount}...`);
//         //                 // Ensure amount is converted to bigint for the RAISE action
//         //                 game.performAction(this.from, PlayerActionType.RAISE, BigInt(this.amount.toString()));
//         //                 break;
//         //             default:
//         //                 throw new Error(`Invalid action: ${playerAction}`);
//         //         };

//         //         const _json = game.toJson();
//         //         await this.gameManagement.saveFromJSON(_json);

//         //         const gameTx: Transaction = await Transaction.create(this.to, this.from, this.amount, 0n, this.privateKey, this.data ?? "");
//         //         await this.mempool.add(gameTx);
//         //         return signResult(gameTx, this.privateKey);
//         //     } 

//         //     // if (await this.isGameTransaction(this.from)) {
//         //     //     const json = await this.gameManagement.get(this.from);
//         //     //     const gameOptions = await this.contractSchemas.getGameOptions(this.from);

//         //     //     const game: TexasHoldemGame = TexasHoldemGame.fromJson(json, gameOptions);

//         //     //     // Assume player is leaving the game
//         //     //     console.log(`Player ${this.to} leaving game...`);
//         //     //     const stack = game.leave(this.to);
//         //     //     if (stack !== this.amount) {
//         //     //         throw new Error("Leave amount doesn't match player's stack");
//         //     //     }
//         //     //     console.log(`Leave successful, returning ${stack} chips`);

//         //     //     const _json = game.toJson();
//         //     //     await this.gameManagement.saveFromJSON(_json);

//         //     //     const gameTx: Transaction = await Transaction.create(this.to, this.from, stack, 0n, this.privateKey, this.data ?? "");
//         //     //     await this.mempool.add(gameTx);
//         //     //     return signResult(gameTx, this.privateKey);
//         //     // }

//         //     console.log(`Processing EUA transaction...`);

//         //     // If we haven't thrown an error, then we can create the transaction
//         //     const transferTx: Transaction = await Transaction.create(this.to, this.from, this.amount, 0n, this.privateKey, this.data ?? "");
//         //     await this.mempool.add(transferTx);

//         //     return signResult(transferTx, this.privateKey);

//         // } catch (e) {
//         //     console.error(`Error in transfer command:`, e);
//         //     throw new Error("Error transferring funds");
//         // }
//     }

//     private async isGameTransaction(address: string): Promise<Boolean> {
//         console.log(`Checking if ${address} is a game transaction...`);
//         const existingContractSchema = await contractSchemas.findOne({ address: address });

//         console.log(`Contract schema found:`, existingContractSchema);
//         const found: Boolean = existingContractSchema !== null;

//         console.log(`Is game transaction: ${found}`);
//         return found;
//     }
// }
