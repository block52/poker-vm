import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models";
import { signResult } from "./abstractSignedCommand";
import { ICommand, ISignedResponse } from "./interfaces";
import { GameManagement, getGameManagementInstance } from "../state/gameManagement";
import TexasHoldemGame, { GameOptions } from "../engine/texasHoldem";
import { AccountCommand } from "./accountCommand";
import contractSchemas from "../schema/contractSchemas";

export class TransferCommand implements ICommand<ISignedResponse<Transaction>> {
    private readonly gameManagement: GameManagement;
    private readonly mempool: Mempool;

    constructor(private from: string, private to: string, private amount: bigint, private data: string | null, private readonly privateKey: string) {
        console.log(`Creating TransferCommand: from=${from}, to=${to}, amount=${amount}, data=${data}`);
        this.gameManagement = getGameManagementInstance();
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<Transaction>> {
        console.log(`Executing transfer command...`);

        const accountCommand = new AccountCommand(this.from, this.privateKey);
        const accountResponse = await accountCommand.execute();
        const fromAccount = accountResponse.data;
        console.log(`Account balance for ${this.from}: ${fromAccount.balance}`);

        if (this.amount > fromAccount.balance) {
            console.log(`Insufficient balance: required=${this.amount}, available=${fromAccount.balance}`);
            throw new Error("Insufficient balance");
        }

        // todo: check nonce
        // Check if from is a game account
        try {
            if (this.data && await this.isGameTransaction(this.to)) {
                console.log(`Processing game transaction: data=${this.data}, to=${this.to}`);

                const json = await this.gameManagement.get(this.to);
                console.log(`Current game state:`, json);

                // These need to be fetched from the contract in the future
                const gameOptions: GameOptions = {
                    minBuyIn: 100000000000000000n,
                    maxBuyIn: 1000000000000000000n,
                    minPlayers: 2,
                    maxPlayers: 9,
                    smallBlind: 10000000000000000n,
                    bigBlind: 20000000000000000n,
                };

                const game: TexasHoldemGame = TexasHoldemGame.fromJson(json, gameOptions);
                console.log(`Game object created, processing action: ${this.data}`);

                if (!game) {
                    console.log(`No game found for address ${this.to}`);
                    // return default response
                }

                // Replay tx from mempool

                // Cast string to PlayerActionType
                const playerAction: PlayerActionType = this.data as PlayerActionType;
                console.log(`Player action type: ${playerAction}`);

                switch (playerAction) {
                    case "join":
                        console.log(`Player ${this.from} joining game with ${this.amount} chips...`);
                        game.join2(this.from, this.amount);
                        console.log(`Join successful`);
                        break;
                    case "bet":
                        console.log(`Player ${this.from} betting ${this.amount}...`);
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

                const _json = game.toJson();
                await this.gameManagement.saveFromJSON(_json);

                const gameTx: Transaction = await Transaction.create(this.to, this.from, this.amount, 0n, this.privateKey, this.data ?? "");
                return signResult(gameTx, this.privateKey);
            } else {
                console.log(`Processing regular transaction...`);

                // // If we haven't thrown an error, then we can create the transaction
                // console.log(`Creating transaction...`);
                const transferTx: Transaction = await Transaction.create(this.to, this.from, this.amount, 0n, this.privateKey, this.data ?? "");
                // console.log(`Adding transaction to mempool...`);
                await this.mempool.add(transferTx);

                return signResult(transferTx, this.privateKey);
            }
        } catch (e) {
            console.error(`Error in transfer command:`, e);
            throw new Error("Error transferring funds");
        }
    }

    private async isGameTransaction(address: string): Promise<Boolean> {
        console.log(`Checking if ${address} is a game transaction...`);
        const existingContractSchema = await contractSchemas.find({ address: address });
        console.log(`Contract schema found:`, existingContractSchema);
        return existingContractSchema !== undefined;
    }
}
