import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range, TurnWithSeat } from "../types";

class RaiseAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.RAISE;
    }

    /**
     * Verify if a player can raise and determine the valid raise range
     * 
     * For a raise to be valid:
     * 1. Player must be active and it must be their turn (checked in base verify)
     * 2. Game must not be in the ANTE round (only small/big blinds allowed)
     * 3. Blinds must be posted before raising is allowed in preflop
     * 4. There must be a previous bet or raise to raise against
     * 
     * The minimum raise amount follows poker rules:
     * - At least double the previous bet OR
     * - At least the previous bet plus the big blind (whichever is larger)
     * 
     * @param player The player attempting to raise
     * @returns Range object with minimum and maximum raise amounts
     * @throws Error if raising conditions are not met
     */
    verify(player: Player): Range {
        // 1. Perform basic validation (player active, player's turn, etc.)
        super.verify(player);
        
        // 2. Cannot raise in the ANTE round
        if (this.game.currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot raise in the ante round. Small blind must post.");
        }

        if (this.game.currentRound === TexasHoldemRound.SHOWDOWN) {
            throw new Error("Cannot raise in the showdown round.");
        }

        // 3. For preflop, ensure blinds have been posted
        if (this.game.currentRound === TexasHoldemRound.PREFLOP) {
            const playerSeat = this.game.getPlayerSeatNumber(player.address);
            const isSmallBlind = playerSeat === this.game.smallBlindPosition;

            if (isSmallBlind) {
                // Can reopen the betting with a minimum of big blind
                return { minAmount: this.game.smallBlind + this.game.bigBlind, maxAmount: player.chips };
            }
        }

        // 4. Need a previous bet or raise to raise
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
    private findLastBetOrRaise(): TurnWithSeat | undefined {
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
