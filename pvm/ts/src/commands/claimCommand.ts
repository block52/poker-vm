import { NonPlayerActionType } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { getGameManagementInstance, getTransactionInstance } from "../state/index";
import TexasHoldemGame from "../engine/texasHoldem";
import { Result } from "../engine/types";
import { IGameManagement, ITransactionManagement } from "../state/interfaces";

export class ClaimCommand implements ISignedCommand<Transaction> {
    private readonly mempool: Mempool;
    private readonly gameManagement: IGameManagement;
    private readonly transactionManagement: ITransactionManagement;

    constructor(
        readonly playerAddress: string,  // Player claiming winnings
        readonly tableAddress: string,   // Table holding the funds
        readonly actionIndex: number,    // Action index for the claim
        readonly nonce: number,
        private readonly privateKey: string,
        private readonly addToMempool: boolean = true
    ) {
        this.mempool = getMempoolInstance();
        this.gameManagement = getGameManagementInstance();
        this.transactionManagement = getTransactionInstance();
    }

    public async execute(): Promise<ISignedResponse<Transaction>> {
        console.log(`\n🎯 ClaimCommand Execute Started:`, {
            playerAddress: this.playerAddress,
            tableAddress: this.tableAddress,
            actionIndex: this.actionIndex,
            nonce: this.nonce
        });

        // 1. Get game state to find the payout amount
        const gameState = await this.gameManagement.getByAddress(this.tableAddress);
        if (!gameState) {
            throw new Error(`Game state not found for table: ${this.tableAddress}`);
        }

        const gameOptions = await this.gameManagement.getGameOptions(this.tableAddress);
        const game: TexasHoldemGame = TexasHoldemGame.fromJson(gameState.state, gameOptions);

        // 2. Find unclaimed result for this player
        const results: Result[] = (game as any)._results || [];
        const result = results.find(r => r.playerId === this.playerAddress && !r.claimed);

        if (!result) {
            throw new Error(`No unclaimed winnings found for player ${this.playerAddress}`);
        }

        if (result.payout === 0n) {
            throw new Error(`No payout to claim for player ${this.playerAddress} (place ${result.place})`);
        }

        console.log(`💰 Claim Details:`, {
            player: this.playerAddress,
            place: result.place,
            payout: result.payout.toString(),
            payoutInTokens: Number(result.payout) / 1e18
        });

        // 3. Create claim transaction data
        const data = `CLAIM_${this.tableAddress}_${this.playerAddress}_${result.place}`;

        // 4. Check if this claim has already been processed to prevent duplicates
        console.log("📝 Checking for existing claim transaction with data:", data);
        const exists = await this.transactionManagement.getTransactionByData(data);

        if (exists) {
            console.log("ℹ️ Claim transaction already exists in blockchain, returning existing transaction");
            // Return the existing transaction instead of throwing an error
            return signResult(exists, this.privateKey);
        }

        // 5. Create transaction: FROM table TO player with payout amount
        // This is the key: funds flow FROM the table TO the player
        const claimTx: Transaction = await Transaction.create(
            this.playerAddress,      // to: player receives the funds
            this.tableAddress,       // from: table sends the funds
            result.payout,           // value: actual payout amount
            BigInt(this.nonce),
            this.privateKey,
            data
        );

        console.log(`📝 Transaction created:`, {
            hash: claimTx.hash,
            from: claimTx.from,
            to: claimTx.to,
            value: claimTx.value.toString(),
            data: claimTx.data
        });

        // 6. Add to mempool if requested
        if (this.addToMempool && !this.mempool.has(claimTx.hash)) {
            await this.mempool.add(claimTx);
            console.log(`✅ Added claim transaction to mempool: ${claimTx.hash}`);
        }

        // 7. Also execute the claim action in the game to mark it as claimed
        // This prevents double claims
        try {
            // Try to mark the claim in the game state
            game.performAction(
                this.playerAddress,
                "claim" as NonPlayerActionType,
                this.actionIndex,
                0n,  // No value needed for the action itself
                undefined
            );

            // The game state will be updated when the transaction is processed
            console.log(`✅ Claim action executed in game engine`);
        } catch (error) {
            console.warn(`Could not execute claim action in game: ${(error as Error).message}`);
            // Continue anyway - the transaction in mempool will handle the actual transfer
        }

        console.log(`✅ ClaimCommand execution complete`);
        return signResult(claimTx, this.privateKey);
    }
}