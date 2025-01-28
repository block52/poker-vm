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

        console.log(`From Account: ${fromAccount}`);
        console.log(`From Account Balance: ${fromAccount.balance}`);

        if (this.amount > fromAccount.balance) {
            throw new Error("Insufficient balance");
        }

        // todo: check nonce

        // Check if from is a game account

        // if (!fromAccount)
        //     throw new Error("Account not found");
        // }

        try {
            // HACK FOR NOW, if the to address is a game address, then we need to join the game
            if (this.data || this.to === ethers.ZeroAddress) {
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
                const playerAction: PlayerActionType = this.data as PlayerActionType || "join";

                if (this.data === "join") {
                    // const state = await this.gameManagement.get(this.to);
                    // if (!state) throw new Error("Game not found");

                    // const game = TexasHoldemGame.fromJson(state);

                    // convert bigints to numbers with 18 decimal places
                    const player: Player = new Player(this.from, this.amount, undefined);

                    game.join(player);
                }
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
