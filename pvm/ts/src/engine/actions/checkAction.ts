import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class CheckAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.CHECK }

    verify(player: Player): Range | undefined {
        super.verify(player);

        // Cannot check in the ANTE round
        if (this.game.currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot check in the ante round. Small blind must post.");
        }

        // Check if this player should be posting the big blind instead
        const seat = this.game.getPlayerSeatNumber(player.address);
        const isBigBlindSeat = seat === this.game.bigBlindPosition;
        
        // If in PREFLOP and big blind player hasn't posted big blind yet, they should post big blind, not check
        if (this.game.currentRound === TexasHoldemRound.PREFLOP && isBigBlindSeat) {
            // Check if big blind has been posted yet
            const bigBlindPosted = this.game.getActionsForRound(TexasHoldemRound.PREFLOP)
                .some(a => a.action === PlayerActionType.BIG_BLIND);
                
            if (!bigBlindPosted) {
                throw new Error("Big blind player must post big blind before checking.");
            }
        }
        
        // Get the largest bet in the current round
        const largestBet = this.getLargestBet();
        
        // Check if cards have been dealt
        const hasDealt = this.game.getActionsForRound(this.game.currentRound)
            .some(a => a.action === NonPlayerActionType.DEAL);
        const anyPlayerHasCards = Array.from(this.game.players.values())
            .some(p => p !== null && p.holeCards !== undefined);
            
        console.log(`CheckAction verify - Player: ${player.address}, largestBet: ${largestBet}, hasDealt: ${hasDealt}, round: ${this.game.currentRound}`);
            
        // Special case: after dealing, in any round, players can always check regardless of bet amounts
        if (hasDealt || anyPlayerHasCards) {
            // After cards are dealt, players can always check
            return { minAmount: 0n, maxAmount: 0n };
        }
        
        // Calculate the total amount the player has already bet in this round
        const totalBetAmount = this.getSumBets(player.address);
        
        // Can't check if player hasn't matched the largest bet and cards haven't been dealt
        if (totalBetAmount < largestBet) {
            console.log(`Cannot check, must at least call the highest bet. Player bet: ${totalBetAmount}, largest bet: ${largestBet}`);
            throw new Error("Cannot check, must at least call the highest bet.");
        }

        return { minAmount: 0n, maxAmount: 0n };
    }

    // Override the execute method to handle the zero amount case specifically for check action
    execute(player: Player, index: number, amount?: bigint): void {
        console.log(`CheckAction execute - Player: ${player.address}, Index: ${index}, Amount: ${amount}`);
        
        // For a check action, verify without requiring an amount
        const range = this.verify(player);
        
        // If there's a range, ensure the amount (even if 0 or undefined) is valid
        if (range) {
            // We know check always has minAmount and maxAmount of 0, so just set amount to 0 if not provided
            const safeAmount = amount || 0n;
            
            // Still validate the range bounds (though for check both min and max are 0)
            if (safeAmount < range.minAmount || safeAmount > range.maxAmount) {
                console.log(`Invalid amount for check: ${safeAmount}, valid range: ${range.minAmount}-${range.maxAmount}`);
                throw new Error(`Invalid amount for check. Must be exactly 0.`);
            }
            
            // Check has no deduct amount (it's always 0)
            // Add the action to the game state
            const round = this.game.currentRound;
            console.log(`Adding check action to game state for round ${round}, index ${index}`);
            this.game.addAction({ 
                playerId: player.address, 
                action: this.type, 
                amount: 0n, 
                index: index 
            }, round);
        } else {
            // Shouldn't reach here as verify should return a range for check
            throw new Error("Unexpected error: Check verification failed to return a range");
        }
    }
}

export default CheckAction;