import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models";
import { signResult } from "./abstractSignedCommand";
import { ICommand, ISignedResponse } from "./interfaces";
import { GameManagement, getGameManagementInstance } from "../state/gameManagement";
import TexasHoldemGame from "../engine/texasHoldem";
import contractSchemas from "../schema/contractSchemas";
import { GameOptions } from "@bitcoinbrisbane/block52";

export class DealCommand implements ICommand<ISignedResponse<any>> {
    private readonly gameManagement: GameManagement;
    private readonly mempool: Mempool;
    private readonly seed: number[];

    constructor(
        private readonly gameAddress: string, 
        private readonly playerAddress: string,
        _seed: string, 
        private readonly privateKey: string
    ) {
        this.gameManagement = getGameManagementInstance();
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

    public async execute(): Promise<ISignedResponse<any>> {

        try {
            // Check if the address is a game contract
            if (await this.isGameContract(this.gameAddress)) {
                const json = await this.gameManagement.get(this.gameAddress);

                // TODO: These need to be fetched from the contract in the future
                const gameOptions: GameOptions = {
                    minBuyIn: 1000000000000000000n,
                    maxBuyIn: 10000000000000000000n,
                    minPlayers: 2,
                    maxPlayers: 9,
                    smallBlind: 100000000000000000n,
                    bigBlind: 200000000000000000n,
                };

                const game: TexasHoldemGame = TexasHoldemGame.fromJson(json, gameOptions);

                if (!game) {
                    throw new Error("Game not found");
                }

                try {
                    // Shuffle the deck with the seed
                    game.shuffle(this.seed);
                    
                    // Deal the cards
                    game.deal(this.seed);
                } catch (error: any) {
                    console.error("Error dealing cards:", error);
                    return signResult({ 
                        success: false, 
                        message: `Failed to deal cards: ${error.message}` 
                    }, this.privateKey);
                }
                
                // Save the updated game state
                const updatedJson = game.toJson();
                await this.gameManagement.saveFromJSON(updatedJson);

                // Create a transaction record for this action
                const dealTx: Transaction = await Transaction.create(
                    this.gameAddress, 
                    this.playerAddress, 
                    0n, // No value transfer
                    0n, 
                    this.privateKey, 
                    "deal"
                );
                
                // Add the transaction to the mempool
                await this.mempool.add(dealTx);

                // Return the signed transaction like in TransferCommand
                return signResult(dealTx, this.privateKey);
            } else {
                throw new Error("Address is not a valid game contract");
            }
        } catch (e) {
            console.error(`Error in deal command:`, e);
            throw new Error("Error dealing cards");
        }
    }

    private async isGameContract(address: string): Promise<boolean> {
        // console.log(`Checking if ${address} is a game contract...`);
        const existingContractSchema = await contractSchemas.find({ address: address });
        // console.log(`Contract schema found:`, existingContractSchema);
        return existingContractSchema !== undefined;
    }
} 