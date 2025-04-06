import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class RaiseAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.RAISE;
    }

    verify(player: Player): Range | undefined {
        super.verify(player);

        const lastBet = this.game.getLastRoundAction();
        if (!lastBet) throw new Error("No previous bet to raise.");

        const largestBet = this.getLargestBet();
        if (largestBet === 0n) throw new Error("Cannot raise when there's been no action.");
        
        const sumBets = this.getSumBets(player.address);
        
        // Special case: Allow big blind to raise in pre-flop
        const playerSeatNumber = this.game.getPlayerSeatNumber(player.address);
        const isPlayerBigBlind = this.game.bigBlindPosition === playerSeatNumber;
        const isPreflop = this.game.currentRound === TexasHoldemRound.PREFLOP;
        
        // Only throw error if not big blind in pre-flop
        if (largestBet === sumBets && !(isPlayerBigBlind && isPreflop)) {
            throw new Error("Player must bet not raise.");
        }

        const minAmount = (lastBet?.amount || 0n) + this.game.bigBlind;
        if (player.chips < minAmount) throw new Error("Player has insufficient chips to raise.");

        return { minAmount: minAmount, maxAmount: player.chips };
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
