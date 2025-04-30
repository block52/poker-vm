import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class BetAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.BET;
    }

    verify(player: Player): Range {
        // Check base conditions (hand active, player's turn, player active)
        super.verify(player);

        // 1. Round state check: Cannot bet during ANTE round
        if (this.game.currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot bet in the ante round.");
        }

        // 2. Bet matching check: Player must match existing bets before betting
        const largestBet = this.getLargestBet();
        const sumBets = this.getSumBets(player.address);

        // 3. Round-specific checks for preflop
        if (this.game.currentRound === TexasHoldemRound.PREFLOP) {
            if (largestBet === 0n) {
                // No bets yet, player can bet any amount
                return { minAmount: this.game.bigBlind, maxAmount: player.chips };
            }
        }

        if (largestBet > sumBets && largestBet > 0n) {
            console.log(`Player must call or raise - largestBet: ${largestBet}, player's bet: ${sumBets}`);
            throw new Error("Player must call or raise.");
        }

        // 4. Chip stack check: Determine betting range based on player's chips
        if (player.chips < this.game.bigBlind) {
            // All-in is the only option if player has less than minimum bet
            return { minAmount: player.chips, maxAmount: player.chips };
        }

        // Return valid betting range from minimum bet to player's entire stack
        return { minAmount: this.game.bigBlind, maxAmount: player.chips };
    }
}

export default BetAction;