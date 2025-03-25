import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models";
import { signResult } from "./abstractSignedCommand";
import { ICommand, ISignedResponse } from "./interfaces";
import { GameManagement, getGameManagementInstance } from "../state/gameManagement";
import TexasHoldemGame, { GameOptions } from "../engine/texasHoldem";
import { AccountCommand } from "./accountCommand";
import contractSchemas from "../schema/contractSchemas";

export class DealCommand implements ICommand<ISignedResponse<any>> {
    private readonly gameManagement: GameManagement;
    private readonly mempool: Mempool;

    constructor(
        private readonly gameAddress: string, 
        private readonly playerAddress: string,
        private readonly seed: string = "", 
        private readonly privateKey: string
    ) {
        // console.log(`Creating DealCommand: gameAddress=${gameAddress}, playerAddress=${playerAddress}, seed=${seed}`);
        this.gameManagement = getGameManagementInstance();
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<any>> {
        // console.log(`Executing deal command...`);

        try {
            // Check if the address is a game contract
            if (await this.isGameContract(this.gameAddress)) {
                // console.log(`Processing deal for game: ${this.gameAddress}`);

                const json = await this.gameManagement.get(this.gameAddress);
                // console.log(`Current game state:`, json);

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
                // console.log(`Game object created, processing deal`);
                // console.log(`Game state in deal command:`, game);

                if (!game) {
                    // console.log(`No game found for address ${this.gameAddress}`);
                    throw new Error("Game not found");
                }

                // Check if cards have already been dealt
                const anyPlayerHasCards = game.getSeatedPlayers().some(p => p.holeCards !== undefined);
                if (anyPlayerHasCards) {
                    // console.log("Cards have already been dealt for this hand");
                    return signResult({ 
                        success: false, 
                        message: "Cards have already been dealt for this hand" 
                    }, this.privateKey);
                }

                // Convert the seed string to a number array for shuffling
                // If seed is provided, use it to create a deterministic shuffle
                let seedArray: number[] = [];
                if (this.seed) {
                    // Create a deterministic seed from the provided string
                    const seedBuffer = Buffer.from(this.seed);
                    seedArray = Array.from({ length: 52 }, (_, i) => {
                        // Use the seed string to generate 52 numbers
                        return (seedBuffer[i % seedBuffer.length] || i) * 19937; // Prime multiplier for better distribution
                    });
                }

                try {
                    // Shuffle the deck with the seed
                    game.shuffle(seedArray);
                    
                    // Deal the cards
                    game.deal(seedArray);
                } catch (error: any) {
                    console.error("Error dealing cards:", error);
                    return signResult({ 
                        success: false, 
                        message: `Failed to deal cards: ${error.message}` 
                    }, this.privateKey);
                }
                
                // Debug: Check if hole cards exist in memory
                const players = game.getSeatedPlayers();
                // console.log("Players after dealing cards:");
                players.forEach(p => {
                    // console.log(`Player ${p.address} cards: ${p.holeCards ? p.holeCards.map(c => c.toString()).join(', ') : 'undefined'}`);
                });
                
                // Save the updated game state
                const updatedJson = game.toJson();
                
                // Debug: Check if hole cards are in the JSON
                // console.log("Player hole cards in JSON:");
                // updatedJson.players.forEach(p => {
                //     // console.log(`Player ${p.address} cards in JSON: ${p.holeCards ? JSON.stringify(p.holeCards) : 'undefined'}`);
                // });
                
                // If hole cards are missing in the JSON, add them manually
                if (players.some(p => p.holeCards) && updatedJson.players.some(p => !p.holeCards)) {
                    // console.log("Hole cards missing in JSON, adding them manually");
                    players.forEach((player, i) => {
                        if (player.holeCards) {
                            const jsonPlayer = updatedJson.players.find(p => p.address === player.address);
                            if (jsonPlayer) {
                                jsonPlayer.holeCards = player.holeCards.map(card => card.toString());
                            }
                        }
                    });
                }
                
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