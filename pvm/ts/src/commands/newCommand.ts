import { getMempoolInstance, Mempool } from "../core/mempool";
import { Deck, Transaction } from "../models";
import { signResult } from "./abstractSignedCommand";
import { ICommand, ISignedResponse } from "./interfaces";
import { getGameManagementInstance } from "../state/index";
import TexasHoldemGame from "../engine/texasHoldem";
import { NonPlayerActionType, TransactionResponse } from "@bitcoinbrisbane/block52";
import { ethers } from "ethers";
import { IGameManagement } from "../state/interfaces";

export class NewCommand implements ICommand<ISignedResponse<TransactionResponse>> {
    private readonly gameManagement: IGameManagement;
    private readonly mempool: Mempool;
    public readonly seed: number[];

    constructor(private readonly address: string, private readonly index: number, private readonly nonce: number, private readonly privateKey: string, _seed: string | undefined = undefined) {
        this.gameManagement = getGameManagementInstance();
        this.mempool = getMempoolInstance();

        // Convert the seed string to a number array for shuffling
        // If seed is provided, use it to create a deterministic shuffle
        if (!_seed) {
            // Create a random seed if not provided
            this.seed = this.createSeed();
        } else {
            this.seed = _seed.split("-").map(Number);
            if (this.seed.length !== 52) {
                throw new Error("Seed must contain exactly 52 numbers separated by dashes");
            }
        }

        console.log(`NewCommand initialized with address: ${this.address}, index: ${this.index}, nonce: ${this.nonce}, seed: ${this.seed}`);
    }

    public async execute(): Promise<ISignedResponse<TransactionResponse>> {
        try {
            const isGameContract = await this.isGameContract(this.address);
            if (!isGameContract) {
                throw new Error(`Address ${this.address} is not a valid game contract`);
            }

            const _game = await this.gameManagement.getByAddress(this.address);

            if (!_game?.state) {
                throw new Error(`Game state not found for address: ${this.address}`);
            }
            
            const gameOptions = await this.gameManagement.getGameOptions(this.address);
            // For existing games, handle reinitialization
            const game: TexasHoldemGame = TexasHoldemGame.fromJson(_game?.state, gameOptions);
            const deck = new Deck();
            deck.shuffle(this.seed);
            game.performAction(this.address, NonPlayerActionType.NEW_HAND, this.index, 0n, deck.toString());

            // Create a transaction record for this action
            const tx: Transaction = await Transaction.create(
                this.address,
                ethers.ZeroAddress,
                0n, // No value transfer
                BigInt(this.nonce),
                this.privateKey,
                `new,${this.index},${deck.toString()}`
            );

            // Add the transaction to the mempool
            await this.mempool.add(tx);

            const response: TransactionResponse = {
                nonce: tx.nonce.toString(),
                to: tx.to,
                from: tx.from,
                value: tx.value.toString(),
                hash: tx.hash,
                signature: tx.signature,
                timestamp: tx.timestamp.toString(),
                data: tx.data
            };

            // Return the signed transaction like in TransferCommand
            return signResult(response, this.privateKey);
        } catch (e) {
            console.error(`Error in new command:`, e);
            throw new Error("Error creating new game: ");
        }
    }

    private async isGameContract(address: string): Promise<boolean> {
        const existingContractSchema = await this.gameManagement.getByAddress(address);
        return existingContractSchema !== undefined;
    }

    private createSeed(): number[] {
        // Create an array to store our random digits
        const digits = new Array(length);

        // Generate random values
        const randomValues = new Uint8Array(length);
        crypto.getRandomValues(randomValues);

        for (let i = 0; i < length; i++) {
            digits[i] = (randomValues[i] % 52) + 1; // Convert 0-255 to 1-52
        }

        return digits;
    }
}
