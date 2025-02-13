import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models";
import { signResult } from "./abstractSignedCommand";
import { ICommand, ISignedResponse } from "./interfaces";
import GameManagement from "../state/gameManagement";
import { AccountManagement, getAccountManagementInstance } from "../state/accountManagement";
import { Player } from "../models/game";
import { ethers } from "ethers";
import TexasHoldemGame from "../engine/texasHoldem";
import { AccountCommand } from "./accountCommand";

export class TransferCommand implements ICommand<ISignedResponse<Transaction>> {
    private readonly gameManagement: GameManagement;
    private readonly mempool: Mempool;
    private readonly accountManagement: AccountManagement;

    constructor(private from: string, private to: string, private amount: bigint, private data: string | null, private readonly privateKey: string) {
        this.gameManagement = new GameManagement();
        this.accountManagement = getAccountManagementInstance();
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<Transaction>> {

        const accountCommand = new AccountCommand(this.from, this.privateKey);
        const accountResponse = await accountCommand.execute();
        const fromAccount = accountResponse.data;

        // const fromAccount = await this.accountManagement.getAccount(this.from);

        if (this.amount > fromAccount.balance) {
            throw new Error("Insufficient balance");
        }

        // todo: check nonce

        // Check if from is a game account

        // if (!fromAccount)
        //     throw new Error("Account not found");
        // }

        try {
            if (this.data) {
                console.log(`Data: ${this.data}`);

                const json = await this.gameManagement.get(this.to);
                const game = TexasHoldemGame.fromJson(json);

                if (!game) {
                    // return default response
                }

                // Replay tx from mempool

                // const gameCommand = JSON.parse(this.data) as { method: PlayerActionType | "join", params: [string] };

                // const playerAction = JSON.parse(this.data) as { method: PlayerActionType | "join", params: [string] };
                // console.log(`Player Action: ${playerAction.method}`);

                // if (this.data === "bet") {
                //     console.log(`Joining game...`);
                //     // await this.gameManagement.join(this.to, this.from);

                //     // rehydrate the game
                //     const game = this.gameManagement.get(this.to);

                //     if (!game) {
                //         throw new Error("Game not found");
                //     }
                // }

                // Cast string to PlayerActionType
                const playerAction: PlayerActionType = this.data as PlayerActionType;

                switch (playerAction) {
                    case "join":
                        console.log(`Joining game...`);
                        const player: Player = new Player(this.from, this.amount, undefined);
    
                        game.join(player);
                        break;
                    case "bet":
                        //game.performAction(tx.from, PlayerActionType.BET, tx.value);
                        break;
                    case "call":
                        //game.performAction(tx.from, PlayerActionType.CALL, tx.value);
                        break;
                    case "fold":
                        //game.performAction(tx.from, PlayerActionType.FOLD, 0n);
                        break;
                    case "check":
                        //game.performAction(tx.from, PlayerActionType.CHECK, 0n);
                        break;
                    case "raise":
                        //game.performAction(tx.from, PlayerActionType.RAISE, tx.value);
                        break;
                    default:
                        throw new Error("Invalid action");
                };
            }

            // If we havent thrown an error, then we can create the transaction
            const transferTx: Transaction = await Transaction.create(this.to, this.from, this.amount, 0n, this.privateKey, this.data ?? "");
            const mempool = getMempoolInstance();
            await mempool.add(transferTx);

            return signResult(transferTx, this.privateKey);
        } catch (e) {
            console.error(e);
            throw new Error("Error transferring funds");
        }
    }
}
