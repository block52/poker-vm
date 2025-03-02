import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models";
import { signResult } from "./abstractSignedCommand";
import { ICommand, ISignedResponse } from "./interfaces";
import { GameManagement, getGameManagementInstance } from "../state/gameManagement";
import TexasHoldemGame from "../engine/texasHoldem";
import { AccountCommand } from "./accountCommand";
import contractSchemas from "../schema/contractSchemas";

export class TransferCommand implements ICommand<ISignedResponse<Transaction>> {
    private readonly gameManagement: GameManagement;
    private readonly mempool: Mempool;

    constructor(private from: string, private to: string, private amount: bigint, private data: string | null, private readonly privateKey: string) {
        this.gameManagement = getGameManagementInstance();
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<Transaction>> {

        const accountCommand = new AccountCommand(this.from, this.privateKey);
        const accountResponse = await accountCommand.execute();
        const fromAccount = accountResponse.data;

        if (this.amount > fromAccount.balance) {
            throw new Error("Insufficient balance");
        }

        // todo: check nonce
        // Check if from is a game account
        try {
            if (this.data && await this.isGameTransaction(this.to)) {
                console.log(`Data: ${this.data}`);

                const json = await this.gameManagement.get(this.to);
                const game = TexasHoldemGame.fromJson(json);

                if (!game) {
                    // return default response
                }

                // Replay tx from mempool

                // Cast string to PlayerActionType
                const playerAction: PlayerActionType = this.data as PlayerActionType;

                switch (playerAction) {
                    case "join":
                        console.log(`Joining game...`);
                        game.join2(this.from, this.amount);
                        break;
                    case "bet":
                        game.performAction(this.from, PlayerActionType.BET, this.amount);
                        break;
                    case "call":
                        game.performAction(this.from, PlayerActionType.CALL);
                        break;
                    case "fold":
                        game.performAction(this.from, PlayerActionType.FOLD);
                        break;
                    case "check":
                        game.performAction(this.from, PlayerActionType.CHECK);
                        break;
                    case "raise":
                        game.performAction(this.from, PlayerActionType.RAISE, this.amount);
                        break;
                    default:
                        throw new Error("Invalid action");
                };
            }

            // If we haven't thrown an error, then we can create the transaction
            const transferTx: Transaction = await Transaction.create(this.to, this.from, this.amount, 0n, this.privateKey, this.data ?? "");
            await this.mempool.add(transferTx);

            return signResult(transferTx, this.privateKey);
        } catch (e) {
            console.error(e);
            throw new Error("Error transferring funds");
        }
    }

    private async isGameTransaction(address: string): Promise<Boolean> {
        const existingContractSchema = await contractSchemas.find({ address: address });
        return existingContractSchema !== undefined;
    }   
}
