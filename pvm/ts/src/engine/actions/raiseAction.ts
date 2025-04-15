import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";
import { NonPlayerActionType } from "@bitcoinbrisbane/block52";

class RaiseAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.RAISE;
    }

    verify(player: Player): Range | undefined {
        // Cannot raise in the ANTE round
        if (this.game.currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot raise in the ante round. Small blind must post.");
        }
        
        // Check if cards have been dealt
        const hasDealt = this.game.getActionsForRound(this.game.currentRound)
            .some(a => a.action === NonPlayerActionType.DEAL);
        const anyPlayerHasCards = Array.from(this.game.players.values())
            .some(p => p !== null && p.holeCards !== undefined);
            
        // After dealing, players should bet (not raise) if there's no bet yet
        if ((hasDealt || anyPlayerHasCards) && this.game.currentRound === TexasHoldemRound.PREFLOP) {
            // Check if anyone has made a bet or raise after the deal
            const betsAfterDeal = this.game.getActionsForRound(this.game.currentRound)
                .filter(a => 
                    a.action === PlayerActionType.BET || 
                    a.action === PlayerActionType.RAISE);
                
            // If no one has bet yet, player should BET not RAISE
            if (betsAfterDeal.length === 0) {
                throw new Error("Cannot raise when there's no bet - use bet action instead.");
            }
        }
        
        // Check if this player should be posting the big blind instead
        const seat = this.game.getPlayerSeatNumber(player.address);
        const isBigBlindSeat = seat === this.game.bigBlindPosition;
        
        // If in PREFLOP and big blind player hasn't posted big blind yet, they should post big blind, not raise
        if (this.game.currentRound === TexasHoldemRound.PREFLOP && isBigBlindSeat) {
            // Check if big blind has been posted yet
            const bigBlindPosted = this.game.getActionsForRound(TexasHoldemRound.PREFLOP)
                .some(a => a.action === PlayerActionType.BIG_BLIND);
                
            if (!bigBlindPosted) {
                throw new Error("Big blind player must post big blind before raising.");
            }
        }
        
        super.verify(player);

        const largestBet = this.getLargestBet();
        
        // Calculate the total amount the player has already bet across all rounds
        let playerTotalBets = 0n;
        
        // Get the sum of bets for this player in the ANTE round
        const anteRoundBets = this.game.getPlayerTotalBets(player.address, TexasHoldemRound.ANTE);
        playerTotalBets += anteRoundBets;
        
        // Get the sum of bets for this player in the current round
        const currentRoundBets = this.game.getPlayerTotalBets(player.address, this.game.currentRound);
        playerTotalBets += currentRoundBets;
        
        // Calculate how much more the player needs to add to match the current largest bet
        const toCall = playerTotalBets >= largestBet ? 0n : largestBet - playerTotalBets;
        
        // The minimum raise is double the largest bet minus what the player has already put in
        // But it must be at least the big blind
        const minRaiseAmount = largestBet + this.game.bigBlind - playerTotalBets;
        const maxRaiseAmount = player.chips;
        
        // Can never raise less than the minimum or more than the player's stack
        return { minAmount: minRaiseAmount, maxAmount: maxRaiseAmount };
    }

    protected getDeductAmount(player: Player, amount?: bigint): bigint {
        if (!amount) return 0n;
        
        // Calculate how much more the player needs to add to the pot
        const currentBet = this.getSumBets(player.address);
        const toAdd = amount - currentBet;
        
        // Return the amount to add (or player's entire stack if they don't have enough)
        return toAdd > player.chips ? player.chips : toAdd;
    }
}

export default RaiseAction;
