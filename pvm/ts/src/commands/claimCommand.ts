import { Transaction } from "../models";
import { getAccountManagementInstance, getGameManagementInstance } from "../state/index";
import { IAccountManagement, IGameManagement } from "../state/interfaces";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import TexasHoldemGame from "../engine/texasHoldem";
import { GameType } from "@bitcoinbrisbane/block52";
import { getMempoolInstance } from "../core/mempool";

export interface ClaimResult {
    success: boolean;
    amount: string;
    gameAddress: string;
    transactionHash?: string;
    message?: string;
}

export class ClaimCommand implements ISignedCommand<ClaimResult> {
    private readonly accountManagement: IAccountManagement;
    private readonly gameManagement: IGameManagement;
    private readonly mempool = getMempoolInstance();

    constructor(private readonly playerAddress: string, private readonly gameAddress: string, private readonly nonce: number, private readonly privateKey: string) {
        this.accountManagement = getAccountManagementInstance();
        this.gameManagement = getGameManagementInstance();
    }

    public async execute(): Promise<ISignedResponse<ClaimResult>> {
        try {
            // 1. Get the game state
            const gameState = await this.gameManagement.getByAddress(this.gameAddress);
            if (!gameState) {
                const result: ClaimResult = {
                    success: false,
                    amount: "0",
                    gameAddress: this.gameAddress,
                    message: `Game state not found for address: ${this.gameAddress}`
                };
                return signResult(result, this.privateKey);
            }

            // 2. Check if it's a sit and go game
            if (gameState.gameOptions.type !== GameType.SIT_AND_GO) {
                const result: ClaimResult = {
                    success: false,
                    amount: "0",
                    gameAddress: this.gameAddress,
                    message: "Claims are only available for Sit and Go games"
                };
                return signResult(result, this.privateKey);
            }

            // 3. Recreate the game to get current state with mempool transactions
            const game = TexasHoldemGame.fromJson(gameState.state, gameState.gameOptions);

            // 4. Get the payout from the results object
            const gameJson = game.toJson(this.playerAddress);
            const playerResult = gameJson.results?.find(result => result.playerId === this.playerAddress);

            if (!playerResult) {
                const result: ClaimResult = {
                    success: false,
                    amount: "0",
                    gameAddress: this.gameAddress,
                    message: "No payout found for this player"
                };
                return signResult(result, this.privateKey);
            }

            const value = BigInt(playerResult.payout);
            if (value <= 0n) {
                const result: ClaimResult = {
                    success: false,
                    amount: "0",
                    gameAddress: this.gameAddress,
                    message: "Payout amount must be greater than zero"
                };
                return signResult(result, this.privateKey);
            }

            const claimString = `CLAIM_${this.playerAddress}_${this.gameAddress}_${playerResult.place}`;


            // const exists = await this.transactionManagement.exists(tx.hash);
            
            // // Check for duplicate claims in mempool
            // for (const tx of this.mempool.getAll()) {
            //     if (tx.from === this.playerAddress && tx.to === this.gameAddress && tx.data === claimString) {

            const transaction = await Transaction.create(this.playerAddress, this.gameAddress, value, BigInt(this.nonce), this.privateKey, claimString);

            this.creditAccount(this.playerAddress, value);
            this.mempool.add(transaction);

            if (!this.mempool.has(transaction.hash)) {
                this.mempool.add(transaction); // Add to mempool immediately
            }

            const result: ClaimResult = {
                success: true,
                amount: value.toString(),
                gameAddress: this.gameAddress,
                transactionHash: transaction.hash,
                message: `Successfully claimed ${value.toString()} tokens for ${playerResult.place} place`
            };

            return signResult(result, this.privateKey);
        } catch (error) {
            const result: ClaimResult = {
                success: false,
                amount: "0",
                gameAddress: this.gameAddress,
                message: `Error processing claim: ${(error as Error).message}`
            };
            return signResult(result, this.privateKey);
        }
    }

    private async creditAccount(playerAddress: string, amount: bigint): Promise<void> {
        // Use the account management interface to increment balance
        await this.accountManagement.incrementBalance(playerAddress, amount);
    }
}
