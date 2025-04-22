import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class BetAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.BET;
    }

    verify(player: Player): Range | undefined {
        if (this.game.currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot bet in the ante round.");
        }

        // Can never bet if you haven't matched the largest bet of the round
        const largestBet = this.getLargestBet();
        const sumBets = this.getSumBets(player.address);
        
        // Add debug logging to help diagnose the issue
        // console.log(`BetAction verify - Player: ${player.address}, largestBet: ${largestBet}, sumBets: ${sumBets}, round: ${this.game.currentRound}`);

        // Fix the condition to properly handle round transitions
        // Only check this if there are actual bets in the current round
        if (largestBet > sumBets && largestBet > 0n) {
            console.log(`Player must call or raise - largestBet: ${largestBet}, player's bet: ${sumBets}`);
            throw new Error("Player must call or raise.");
        }

        // If we're in preflop and players have made equal bets (both at big blind level),
        // this means someone has called - betting is no longer valid, only check or raise
        if (this.game.currentRound === TexasHoldemRound.PREFLOP) {
            // Get all bets in the current round
            const roundBets = this.game.getBets(this.game.currentRound);
            const allBetsEqual = Array.from(roundBets.values()).every(bet => bet === largestBet);
            
            // If all bets are equal and we're beyond the blind postings (2+ players acted),
            // then we should not allow betting - only checking or raising
            if (allBetsEqual && roundBets.size >= 2 && largestBet === this.game.bigBlind) {
                console.log("Cannot bet after call in preflop - use check or raise instead.");
                throw new Error("Cannot bet after call in preflop - use check or raise instead.");
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
