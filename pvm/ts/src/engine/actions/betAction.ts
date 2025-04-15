import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class BetAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.BET;
    }

    verify(player: Player): Range | undefined {
        // Cannot bet in the ANTE round
        if (this.game.currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot bet in the ante round. Small blind must post.");
        }
        
        // If in PREFLOP round and this player is the big blind position, they should post the big blind first
        if (this.game.currentRound === TexasHoldemRound.PREFLOP) {
            const seat = this.game.getPlayerSeatNumber(player.address);
            const isBigBlindSeat = seat === this.game.bigBlindPosition;
            
            // Check if big blind has been posted yet
            const preFlopActions = this.game.getActionsForRound(TexasHoldemRound.PREFLOP);
            const hasBigBlindPosted = preFlopActions.some(a => a.action === PlayerActionType.BIG_BLIND);
            
            if (isBigBlindSeat && !hasBigBlindPosted) {
                throw new Error("Big blind player must post big blind first before betting.");
            }
        }
        
        // Check if cards have been dealt
        const preFlopActions = this.game.getActionsForRound(TexasHoldemRound.PREFLOP);
        const cardsDealt = preFlopActions.some(a => a.action === "deal");
        console.log(`Cards dealt: ${cardsDealt}`);
        
        // Can never bet if you haven't matched the largest bet of the round
        // UNLESS the cards have been dealt
        const largestBet = this.getLargestBet();
        const sumBets = this.getSumBets(player.address);
        
        console.log(`BetAction verify - Player: ${player.address}, largestBet: ${largestBet}, sumBets: ${sumBets}, round: ${this.game.currentRound}`);

        // Only enforce the "must call first" rule if cards haven't been dealt yet
        if (largestBet > sumBets && largestBet > 0n && !cardsDealt) {
            console.log(`Player must call or raise before dealing - largestBet: ${largestBet}, player's bet: ${sumBets}`);
            throw new Error("Player must call or raise before cards are dealt.");
        }

        // If we're in preflop and players have made equal bets (both at big blind level),
        // Allow betting if cards have been dealt, otherwise check for existing conditions
        if (this.game.currentRound === TexasHoldemRound.PREFLOP) {
            // Get all bets in the current round
            const roundBets = this.game.getBets(this.game.currentRound);
            const allBetsEqual = Array.from(roundBets.values()).every(bet => bet === largestBet);
            
            // If all bets are equal and we're beyond the blind postings (2+ players acted),
            // AND cards have not been dealt yet, then we should not allow betting
            if (allBetsEqual && roundBets.size >= 2 && largestBet === this.game.bigBlind && !cardsDealt) {
                console.log("Cannot bet after call in preflop before deal - use check or raise instead.");
                throw new Error("Cannot bet after call in preflop before deal - use check or raise instead.");
            }
        }

        super.verify(player);

        if (player.chips < this.game.bigBlind) {
            return { minAmount: player.chips, maxAmount: player.chips };
        }

        return { minAmount: this.game.bigBlind, maxAmount: player.chips };
    }
}

export default BetAction;
