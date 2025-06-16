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
            if (seat === this.game.smallBlindPosition) {
                // Small blind needs to call the difference to match big blind
                const largestBet = this.getLargestBet(); // Include ante bets in preflop
                const playerBet = this.game.getPlayerTotalBets(player.address, currentRound, true); // Include ante bets in preflop
                const amount = (largestBet + this.game.bigBlind) - playerBet;
                return { minAmount: amount, maxAmount: amount };
            }

            if (seat === this.game.bigBlindPosition) {
                // Big blind can only call if there is a raise
                const largestBet = this.getLargestBet();
                const playerBet = this.game.getPlayerTotalBets(player.address, currentRound, true);
                if (largestBet > playerBet) {
                    // Big blind needs to call the difference to match the largest bet
                    const amount = largestBet - playerBet;
                    return { minAmount: amount, maxAmount: amount };
                }
            }

            const largestBet = this.getLargestBet(true);
            const playerBet = this.game.getPlayerTotalBets(player.address, currentRound, true);
            
            if (seat === this.game.bigBlindPosition && largestBet === playerBet) {
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

    // execute(player: Player, index: number, amount: bigint): void {
    //     // Get the valid call amount from verify
    //     // const range = this.verify(player);
    //     // const deductAmount = range.minAmount;

    //     if (player.chips < amount) throw new Error(`Player has insufficient chips to ${this.type}.`);
    //     player.chips -= amount;


    //     const round = this.game.currentRound;
    //     this.game.addAction(
    //         { playerId: player.address, action: !player.chips && amount ? PlayerActionType.ALL_IN : this.type, amount: amount, index: index },
    //         round
    //     );
    // }

    private getDeductAmount(player: Player): bigint {
        const playerSeat = this.game.getPlayerSeatNumber(player.address);
        const currentRound = this.game.currentRound;
        let playerBet = this.game.getPlayerTotalBets(player.address, currentRound, true); // Include ante bets in preflop
        const largestBet = this.getLargestBet(true);

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
            return 0n; // Already matched or exceeded the largest bet
        }

        return largestBet - playerBet;
    }
}

export default CallAction;
