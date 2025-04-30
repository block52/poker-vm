import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class CallAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.CALL }

    verify(player: Player): Range {
        // Check base conditions (hand active, player's turn, player active)
        super.verify(player);

        // 1. Round state check: Cannot call during ANTE round
        if (this.game.currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Call action is not allowed during ante round.");
        }

        // 2. Round-specific checks for preflop
        if (this.game.currentRound === TexasHoldemRound.PREFLOP) {
            // Special case for small blind position in PREFLOP
            if (this.game.getPlayerSeatNumber(player.address) === this.game.smallBlindPosition) {
                // Small blind needs to call the difference to match big blind
                const amount = this.game.bigBlind - this.game.smallBlind;
                return { minAmount: amount, maxAmount: amount };
            }
        }
        
        // 3. Action sequence check: Need a previous action with amount to call
        const lastAction = this.game.getLastRoundAction();
        if (!lastAction) {
            throw new Error("No previous action to call.");
        }

        // 4. Amount validation: Last action must have a non-zero amount
        if (lastAction?.amount === 0n || !lastAction?.amount) {
            throw new Error("Should check instead.");
        }

        // 5. Last action validation: Must be a bet or raise (or blind)
        if (lastAction.action !== PlayerActionType.BET && 
            lastAction.action !== PlayerActionType.RAISE && 
            lastAction.action !== PlayerActionType.SMALL_BLIND && 
            lastAction.action !== PlayerActionType.BIG_BLIND) {
            throw new Error("Last action was not a bet or raise.");
        }

        // 6. Player bet check: Calculate the amount needed to call
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

    execute(player: Player, index: number): void {
        // Get the valid call amount from verify
        const range = this.verify(player);
        const deductAmount = range.minAmount;
        
        if (deductAmount) {
            if (player.chips < deductAmount)
                throw new Error(`Player has insufficient chips to ${this.type}.`);

            player.chips -= deductAmount;
        }

        const round = this.game.currentRound;
        this.game.addAction({ playerId: player.address, action: !player.chips && deductAmount ? PlayerActionType.ALL_IN : this.type, amount: deductAmount, index: index }, round);
    }

    getDeductAmount(player: Player): bigint {
        const playerSeat = this.game.getPlayerSeatNumber(player.address);
        const playerBet = this.getSumBets(player.address);
        const largestBet = this.getLargestBet();
        
        // Special case for small blind in preflop
        if (this.game.currentRound === TexasHoldemRound.PREFLOP && 
            playerSeat === this.game.smallBlindPosition &&
            playerBet === this.game.smallBlind) {
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