import { GameOptions, NonPlayerActionType, PlayerActionType } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models";
import { signResult } from "./abstractSignedCommand";
import { ICommand, ISignedResponse } from "./interfaces";
import { GameManagement, getGameManagementInstance } from "../state/gameManagement";
import TexasHoldemGame from "../engine/texasHoldem";
import { AccountCommand } from "./accountCommand";
import contractSchemas from "../schema/contractSchemas";
import { ContractSchemaManagement, getContractSchemaManagement } from "../state/contractSchemaManagement";

export class TransferCommand implements ICommand<ISignedResponse<Transaction>> {
    private readonly gameManagement: GameManagement;
    private readonly contractSchemas: ContractSchemaManagement;
    private readonly mempool: Mempool;

    constructor(private from: string, private to: string, private amount: bigint, private readonly nonce: number | 0, private data: string | null, private readonly privateKey: string) {
        console.log(`Creating TransferCommand: from=${from}, to=${to}, amount=${amount}, data=${data}`);
        this.gameManagement = getGameManagementInstance();
        this.contractSchemas = getContractSchemaManagement();
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<Transaction>> {
        console.log(`Executing transfer command...`);

        const accountCommand = new AccountCommand(this.from, this.privateKey);
        const accountResponse = await accountCommand.execute();
        const fromAccount = accountResponse.data;
        console.log(`Account balance for ${this.from}: ${fromAccount.balance} ${fromAccount.nonce}`);

        if (this.nonce !== fromAccount.getNextNonce()) {
            console.log(`Invalid nonce: expected=${fromAccount.getNextNonce()}, provided=${this.nonce}`);
            throw new Error("Invalid nonce");
        }

        if (this.amount > fromAccount.balance) {
            console.log(`Insufficient balance: required=${this.amount}, available=${fromAccount.balance}`);
            throw new Error("Insufficient balance");
        }

        // Check if from is a game account
        try {
            if (await this.isGameTransaction(this.to)) {
                console.log(`Processing game transaction: data=${this.data}, to=${this.to}`);

                const [json, gameOptions] = await Promise.all([
                    this.gameManagement.get(this.to),
                    this.contractSchemas.getGameOptions(this.to)
                ]);

                const game: TexasHoldemGame = TexasHoldemGame.fromJson(json, gameOptions);

                console.log(`Player ${this.from} joining game with ${this.amount} chips...`);
                game.performAction(this.from, NonPlayerActionType.JOIN, game.getTurnIndex(), this.amount);
                console.log(`Join successful`);

                // const _json = game.toJson();
                // await this.gameManagement.saveFromJSON(_json);

                const gameTx: Transaction = await Transaction.create(this.to, this.from, this.amount, 0n, this.privateKey, "JOIN");
                await this.mempool.add(gameTx);
                return signResult(gameTx, this.privateKey);
            }

            if (await this.isGameTransaction(this.from)) {
                const json = await this.gameManagement.get(this.from);
                const gameOptions = await this.contractSchemas.getGameOptions(this.from);

                const game: TexasHoldemGame = TexasHoldemGame.fromJson(json, gameOptions);

                // Assume player is leaving the game
                console.log(`Player ${this.to} leaving game...`);
                const player = game.getPlayer(this.from);
                const stack = player?.chips ?? 0n;
                game.performAction(this.to, NonPlayerActionType.LEAVE, game.getTurnIndex(), stack);
                console.log(`Leave successful, returning ${stack} chips`);

                // const _json = game.toJson();
                // await this.gameManagement.saveFromJSON(_json);

                const gameTx: Transaction = await Transaction.create(this.to, this.from, stack, 0n, this.privateKey, "LEAVE");
                await this.mempool.add(gameTx);
                return signResult(gameTx, this.privateKey);
            }

            console.log(`Processing EUA transaction...`);

            // If we haven't thrown an error, then we can create the transaction
            const transaction: Transaction = await Transaction.create(this.to, this.from, this.amount, 0n, this.privateKey, this.data ?? "");
            await this.mempool.add(transaction);

            return signResult(transaction, this.privateKey);

        } catch (e) {
            console.error(`Error in transfer command:`, e);
            throw new Error("Error transferring funds");
        }
    }

    private async isGameTransaction(address: string): Promise<Boolean> {
        console.log(`Checking if ${address} is a game transaction...`);
        const existingContractSchema = await contractSchemas.findOne({ address: address });

        console.log(`Contract schema found:`, existingContractSchema);
        const found: Boolean = existingContractSchema !== null;

        console.log(`Is game transaction: ${found}`);
        return found;
    }
}
