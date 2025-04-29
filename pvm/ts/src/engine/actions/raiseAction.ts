import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class RaiseAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.RAISE;
    }

    verify(player: Player): Range {
        // Basic validation
        super.verify(player);
        
        // Cannot raise in the ANTE round
        if (this.game.currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot raise in the ante round. Small blind must post.");
        }

        // For preflop, ensure blinds have been posted
        if (this.game.currentRound === TexasHoldemRound.PREFLOP) {
            if (!this.game.getActionsForRound(TexasHoldemRound.ANTE).some(action => action.action === PlayerActionType.SMALL_BLIND)) {
                throw new Error("Small blind must post before raising.");
            }

            if (!this.game.getActionsForRound(TexasHoldemRound.ANTE).some(action => action.action === PlayerActionType.BIG_BLIND)) {
                throw new Error("Big blind must post before raising.");
            }
        }

        // Need a previous bet or raise to raise
        const lastBetOrRaise = this.findLastBetOrRaise();
        if (!lastBetOrRaise) {
            throw new Error("No previous bet to raise.");
        }

        // Calculate minimum raise amount
        const largestBet = this.getLargestBet();
        const playerCurrentBet = this.getSumBets(player.address);
        
        // Standard minimum raise is double the previous bet/raise
        // But in all cases, a player must add at least the big blind
        const doubleLastBet = largestBet * 2n;
        const lastBetPlusBigBlind = largestBet + this.game.bigBlind;
        
        // Use the larger of the two options for minimum raise
        const minRaise = doubleLastBet > lastBetPlusBigBlind ? doubleLastBet : lastBetPlusBigBlind;
        
        // Calculate how much more the player needs to add
        let minAmountToAdd = minRaise - playerCurrentBet;
        
        // If player doesn't have enough for the minimum raise, they can go all-in
        if (player.chips < minAmountToAdd) {
            minAmountToAdd = player.chips;
        }

        return { 
            minAmount: minAmountToAdd, 
            maxAmount: player.chips 
        };
    }

    // Find the last bet or raise in the current round
    private findLastBetOrRaise() {
        const actions = this.game.getActionsForRound(this.game.currentRound);
        for (let i = actions.length - 1; i >= 0; i--) {
            if (actions[i].action === PlayerActionType.BET || actions[i].action === PlayerActionType.RAISE) {
                return actions[i];
            }
        }
        return undefined;
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
