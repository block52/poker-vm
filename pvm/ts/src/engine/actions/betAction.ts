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
        const currentRound = this.game.currentRound;
        if (currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot bet in the ante round.");
        }

        if (currentRound === TexasHoldemRound.SHOWDOWN) {
            throw new Error("Cannot bet in the showdown round.");
        }

        // 2. Bet matching check: Player must match existing bets before betting
        const includeBlinds = currentRound === TexasHoldemRound.PREFLOP;
        const largestBet = this.getLargestBet(includeBlinds);
        const playerBets = this.game.getPlayerTotalBets(player.address);

        // 3. Round-specific checks for preflop
        if (currentRound === TexasHoldemRound.PREFLOP) {
            if (largestBet === 0n) {
                // Special case for small blind position in PREFLOP
                if (this.game.getPlayerSeatNumber(player.address) === this.game.smallBlindPosition) {
                    throw new Error("Can only post small blind.");
                }

                // No bets yet, player can bet any amount
                return { minAmount: this.game.bigBlind, maxAmount: player.chips };
            }

            if (largestBet === this.game.smallBlind) {
                // Player can reopen the betting with a minimum of big blind
                return { minAmount: this.game.bigBlind, maxAmount: player.chips };
            }
        }

        if (largestBet > playerBets && largestBet > 0n) {
            // console.log(`Player must call or raise - largestBet: ${largestBet}, player's bet: ${playerBets}`);
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

    execute(player: Player, index: number, amount: bigint): void {
        // Verify the player can perform the call action
        if (amount <= 0n) {
            throw new Error("Bet amount must be greater than zero.");
        }

        super.execute(player, index, amount);
    }
}

export default BetAction;