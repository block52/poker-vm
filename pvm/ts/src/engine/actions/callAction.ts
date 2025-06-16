import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";
import { availableMemory } from "process";

class CallAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.CALL;
    }

    verify(player: Player): Range {
        // Check base conditions (hand active, player's turn, player active)
        super.verify(player);

        // 1. Round state check: Cannot call during ANTE round
        const currentRound = this.game.currentRound;
        if (currentRound === TexasHoldemRound.ANTE || currentRound === TexasHoldemRound.SHOWDOWN) {
            throw new Error(`Call action is not allowed during ${currentRound} round.`);
        }

        // 2. Special case for preflop round
        if (currentRound === TexasHoldemRound.PREFLOP) {
            // Special case for small blind position in PREFLOP
            const seat = this.game.getPlayerSeatNumber(player.address);
            const playersBet = this.game.getPlayerTotalBets(player.address, currentRound, true);

            if (seat === this.game.smallBlindPosition) {
                // Small blind needs to call the difference to match big blind
                const largestBet = this.getLargestBet();
                const largestBet2 = this.getLargestBet(true);

                if (largestBet2 === this.game.bigBlind) {
                    // No bets yet, small blind can call the big blind
                    return { minAmount: this.game.bigBlind - playersBet, maxAmount: this.game.bigBlind - playersBet };
                }

                if (largestBet > playersBet) {
                    // Small blind needs to call the difference to match the largest bet
                    const amount = largestBet - playersBet;
                    return { minAmount: amount, maxAmount: amount };
                }

                const amount = (largestBet + this.game.bigBlind) - playersBet;
                return { minAmount: amount, maxAmount: amount };
            }

            if (seat === this.game.bigBlindPosition) {
                // const largestBet = this.getLargestBet();
                const largestBet2 = this.getLargestBet(true);

                if (largestBet2 === this.game.bigBlind) {
                    // No bets yet, big blind can call the big blind
                    // return { minAmount: this.game.bigBlind - playersBet, maxAmount: this.game.bigBlind - playersBet };
                    throw new Error("Big blind cannot call in preflop round.");
                }

                // Big blind can only call if there is a raise
                if (largestBet2 > playersBet) {
                    // Big blind needs to call the difference to match the largest bet
                    const amount = largestBet2 - playersBet;
                    return { minAmount: amount, maxAmount: amount };
                }
            }

            const largestBet = this.getLargestBet(true);
            if (seat === this.game.bigBlindPosition && largestBet === playersBet) {
                // Error message not quite right
                throw new Error("Big blind cannot call in preflop round.");
            }

            // If the player is big blind and the largest bet is only the small bind (sb called)
            if (seat === this.game.bigBlindPosition && largestBet === this.game.smallBlind) {
                // Nothing to call
                throw new Error("Small blind has only called and there is no action to call.");
            }
        }

        // 3. Action sequence check: Need a previous action with amount to call
        // If UTG after blinds, this is valid
        const lastAction = this.game.getLastRoundAction();
        if (!lastAction && this.game.currentRound !== TexasHoldemRound.PREFLOP) {
            throw new Error("No previous action to call.");
        }

        // // 6. Player bet check: Calculate the amount needed to call
        let deductAmount: bigint = this.getDeductAmount(player);

        // 7. Check if player already matched the bet
        if (deductAmount === 0n) {
            throw new Error("Player has already met maximum so can check instead.");
        }

        // Safety check to ensure we never have negative amounts
        if (deductAmount < 0n) {
            deductAmount = 0n;
        }

        // 8. Check player's chip stack
        if (player.chips < deductAmount) {
            deductAmount = player.chips;
        }

        // Return the exact call amount required
        return { minAmount: deductAmount, maxAmount: deductAmount };
    }

    execute(player: Player, index: number, amount: bigint): void {
        // Verify the player can perform the call action
        if (amount <= 0n) {
            throw new Error("Call amount must be greater than zero.");
        }

        super.execute(player, index, amount);
    }

    private getDeductAmount(player: Player): bigint {
        const playerSeat = this.game.getPlayerSeatNumber(player.address);
        const currentRound = this.game.currentRound;
        const includeBlinds = currentRound === TexasHoldemRound.PREFLOP;
        let playerBet = this.game.getPlayerTotalBets(player.address, currentRound, includeBlinds); // Include ante bets in preflop
        const largestBet = this.getLargestBet(includeBlinds);

        // Special case for small blind in preflop
        if (currentRound === TexasHoldemRound.PREFLOP && playerSeat === this.game.smallBlindPosition && playerBet === this.game.smallBlind) {
            // Small blind calling the big blind (difference between BB and SB)
            const amount = (largestBet + this.game.bigBlind) - this.game.smallBlind;
            return amount;
        }

        // Special case for small blind in preflop UTG
        if (currentRound === TexasHoldemRound.PREFLOP && playerBet === 0n && largestBet === 0n) {
            // Small blind calling the big blind (difference between BB and SB)
            return this.game.bigBlind - this.game.smallBlind;
        }

        // General case: difference between largest bet and player's current bet
        if (playerBet >= largestBet) {
            throw new Error("Player has already met maximum bet, cannot call.");
        }

        return largestBet - playerBet;
    }
}

export default CallAction;
