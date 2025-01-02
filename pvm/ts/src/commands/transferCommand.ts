
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { getMempoolInstance } from "../core/mempool";
import { Transaction } from "../models";
import { signResult } from "./abstractSignedCommand";
import { ICommand, ISignedResponse } from "./interfaces";
import GameManagement from "../state/gameManagement";

export class TransferCommand implements ICommand<ISignedResponse<Transaction>> {
    private readonly gameManagement: GameManagement;

    constructor(private from: string, private to: string, private amount: bigint, private data: string | null, private readonly privateKey: string) {
        this.gameManagement = new GameManagement();
    }

    public async execute(): Promise<ISignedResponse<Transaction>> {
        
        if (this.data) {
            console.log(`Data: ${this.data}`);
            const gameCommand = JSON.parse(this.data) as { method: PlayerActionType | "join", params: [string] };
            if (gameCommand.method != "join") {
                const game = this.gameManagement.get(this.to);
                if (!game)
                    throw new Error("Game not found");
                game.performAction(this.from, gameCommand.method, gameCommand.params[0] ? parseInt(gameCommand.params[0]) : undefined);
            }
            else
                this.gameManagement.join(this.to, this.from);
        }

        const transferTx: Transaction = await Transaction.create(this.to, this.from, this.amount, 0n, this.privateKey, this.data ?? "");
        const mempool = getMempoolInstance();
        await mempool.add(transferTx);
        
        return signResult(transferTx, this.privateKey);
    }
}
