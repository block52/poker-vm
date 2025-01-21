
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { getMempoolInstance } from "../core/mempool";
import { Transaction } from "../models";
import { signResult } from "./abstractSignedCommand";
import { ICommand, ISignedResponse } from "./interfaces";
import GameManagement from "../state/gameManagement";
import { get } from "axios";
import { AccountManagement, getAccountManagementInstance } from "../state/accountManagement";

export class TransferCommand implements ICommand<ISignedResponse<Transaction>> {
    private readonly gameManagement: GameManagement;
    private readonly accountManagement: AccountManagement;

    constructor(private from: string, private to: string, private amount: bigint, private data: string | null, private readonly privateKey: string) {
        this.gameManagement = new GameManagement();
        this.accountManagement = getAccountManagementInstance();
    }

    public async execute(): Promise<ISignedResponse<Transaction>> {

        const fromAccount = await this.accountManagement.getAccount(this.from);

        if (fromAccount.balance < this.amount) {
            throw new Error("Insufficient balance");
        }

        // todo: check nonce

        // Check if from is a game account

        // if (!fromAccount)
        //     throw new Error("Account not found");
        // }
        
        if (this.data) {
            console.log(`Data: ${this.data}`);
            // const gameCommand = JSON.parse(this.data) as { method: PlayerActionType | "join", params: [string] };
            
            // const playerAction = JSON.parse(this.data) as { method: PlayerActionType | "join", params: [string] };
            // console.log(`Player Action: ${playerAction.method}`);

            if (this.data === "join") {
                console.log(`Joining game...`);
                // await this.gameManagement.join(this.to, this.from);

                // rehydrate the game 
                const game = this.gameManagement.get(this.to);

                if (!game) {
                    throw new Error("Game not found");
                }
            }

            // Cast string to PlayerActionType
            const playerAction: PlayerActionType = this.data as PlayerActionType;
            
            // if (gameCommand.method !== "join") {
            //     const game = this.gameManagement.get(this.to);
            //     if (!game)
            //         throw new Error("Game not found");
            //     game.performAction(this.from, gameCommand.method, gameCommand.params[0] ? parseInt(gameCommand.params[0]) : undefined);
            // }
            // else
            //     this.gameManagement.join(this.to, this.from);
        }

        const transferTx: Transaction = await Transaction.create(this.to, this.from, this.amount, 0n, this.privateKey, this.data ?? "");
        const mempool = getMempoolInstance();
        await mempool.add(transferTx);
        
        return signResult(transferTx, this.privateKey);
    }
}
