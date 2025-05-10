import { getMempoolInstance, Mempool } from "../core/mempool";
import { Deck, Transaction } from "../models";
import { signResult } from "./abstractSignedCommand";
import { ICommand, ISignedResponse } from "./interfaces";
import { getGameManagementInstance } from "../state/gameManagement";
import TexasHoldemGame from "../engine/texasHoldem";
import contractSchemas from "../schema/contractSchemas";
import { getContractSchemaManagement } from "../state/index";
import { TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { TexasHoldemGameState } from "../types";
import { ethers } from "ethers";
import { IContractSchemaManagement, IGameManagement } from "../state/interfaces";

export class NewCommand implements ICommand<ISignedResponse<any>> {
    private readonly gameManagement: IGameManagement;
    private readonly contractSchemas: IContractSchemaManagement;
    private readonly mempool: Mempool;
    private readonly seed: number[];

    constructor(private readonly address: string, private readonly privateKey: string, _seed: string | undefined = undefined) {
        this.gameManagement = getGameManagementInstance();
        this.contractSchemas = getContractSchemaManagement();
        this.mempool = getMempoolInstance();

        // Convert the seed string to a number array for shuffling
        // If seed is provided, use it to create a deterministic shuffle
        if (!_seed) {
            // Create a random seed if not provided
            this.seed = Array.from({ length: 52 }, () => Math.floor(Math.random() * 100));
        } else {
            // Create a deterministic seed from the provided string
            const seedBuffer = Buffer.from(_seed);
            this.seed = Array.from({ length: 52 }, (_, i) => {
                // Use the seed string to generate 52 numbers
                return (seedBuffer[i % seedBuffer.length] || i) * 19937; // Prime multiplier for better distribution
            });
        }
    }

    public async execute(): Promise<ISignedResponse<Transaction>> {
        try {
            const isGameContract = await this.isGameContract(this.address);
            if (!isGameContract) {
                throw new Error(`Address ${this.address} is not a valid game contract`);
            }

            const [json, gameOptions] = await Promise.all([this.gameManagement.get(this.address), this.contractSchemas.getGameOptions(this.address)]);

            if (!gameOptions) {
                throw new Error(`Game options not found for address ${this.address}`);
            }

            // Create new game if it doesn't exist
            if (!json) {
                console.log(`Creating new game for address: ${this.address}`);

                // TODO: HACK - Using timestamp as nonce. This should follow the TransferCommand pattern
                // of getting the next nonce from the account and validating it.
                const timestampNonce = BigInt(Date.now());

                const address = await this.gameManagement.create(
                    timestampNonce, // Using timestamp as nonce instead of 0n
                    this.address,
                    gameOptions
                );

                // Create a deck for the new game
                const deck = new Deck();
                deck.shuffle(this.seed);

                const newGameJson: TexasHoldemGameState = {
                    type: "cash",
                    address: address,
                    minBuyIn: gameOptions.minBuyIn.toString(),
                    maxBuyIn: gameOptions.maxBuyIn.toString(),
                    minPlayers: gameOptions.minPlayers,
                    maxPlayers: gameOptions.maxPlayers,
                    smallBlind: gameOptions.smallBlind.toString(),
                    bigBlind: gameOptions.bigBlind.toString(),
                    dealer: gameOptions.maxPlayers, // Dealer is the last player (1 based index)
                    players: [],
                    deck: deck.toString(),
                    communityCards: [],
                    pots: ["0"],
                    nextToAct: -1,
                    round: TexasHoldemRound.ANTE,
                    winners: [],
                    signature: ethers.ZeroHash
                };

                await this.gameManagement.saveFromJSON(JSON.stringify(newGameJson));

                // Create a transaction record for this action
                const newGameTx: Transaction = await Transaction.create(
                    this.address,
                    "",
                    0n, // No value transfer
                    timestampNonce,
                    this.privateKey,
                    `create,${deck.toString()}`
                );

                // Add the transaction to the mempool
                await this.mempool.add(newGameTx);

                // Return the signed transaction
                return signResult(newGameTx, this.privateKey);
            }

            // For existing games, handle reinitialization
            const game: TexasHoldemGame = TexasHoldemGame.fromJson(json, gameOptions);

            // if (game.currentRound !== TexasHoldemRound.END) {
            //     throw new Error("Game has not finished yet");
            // }

            const deck = new Deck();
            deck.shuffle(this.seed);
            game.reInit(deck.toString());

            // Save the updated game state
            const updatedJson = game.toJson();
            await this.gameManagement.saveFromJSON(JSON.stringify(updatedJson));

            // TODO: HACK - Using timestamp as nonce. This should follow the TransferCommand pattern
            // of getting the next nonce from the account and validating it.
            const timestampNonce = BigInt(Date.now());

            // Create a transaction record for this action
            const dealTx: Transaction = await Transaction.create(
                this.address,
                "",
                0n, // No value transfer
                timestampNonce,
                this.privateKey,
                `next,${deck.toString()}` //
            );

            // Add the transaction to the mempool
            await this.mempool.add(dealTx);

            // Return the signed transaction like in TransferCommand
            return signResult(dealTx, this.privateKey);
        } catch (e) {
            console.error(`Error in deal command:`, e);
            throw new Error("Error dealing cards");
        }
    }

    private async isGameContract(address: string): Promise<boolean> {
        const existingContractSchema = await contractSchemas.find({ address: address });
        return existingContractSchema !== undefined;
    }
}
