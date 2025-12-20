import { PlayerActionType, TexasHoldemRound } from "@block52/poker-vm-sdk";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class CallAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.CALL;
    }

    verify(player: Player): Range {
        // Check base conditions (hand active, player's turn, player active)
        super.verify(player);

        // 1. Round state check: Cannot call during ANTE, SHOWDOWN, or END rounds
        this.validateNotInAnteRound();
        this.validateNotInShowdownRound();
        this.validateNotInEndRound();

        const currentRound = this.game.currentRound;
        // 2. Get the bets for the current round
        const includeBlinds = currentRound === TexasHoldemRound.PREFLOP;
        const betManager = this.getBetManager(includeBlinds);
        const currentBet: bigint = betManager.getLargestBet();

        if (currentBet === 0n) {
            throw new Error("No previous action to call.");
        }

        const playersBet: bigint = betManager.getTotalBetsForPlayer(player.address);
        if (playersBet === currentBet) {
            // Player has already matched the current bet, can check
            throw new Error("Player has already matched the current bet so can check instead.");
        }

        // 3. Action sequence check: Need a previous action with amount to call
        const delta: bigint = currentBet - playersBet;

        if (delta > player.chips) {
            // Player does not have enough chips to call the full amount
            // They can go all-in with their remaining chips
            return { minAmount: player.chips, maxAmount: player.chips };
        }

        // Return the exact call amount required
        return { minAmount: delta, maxAmount: delta };
    }

    execute(player: Player, index: number, amount: bigint): void {
        // Re-verify the action is still valid before modifying state
        this.verify(player);

        // Verify the amount is greater than zero
        if (amount <= 0n) {
            throw new Error("Call amount must be greater than zero.");
        }

        super.execute(player, index, amount);

        // Set player state to ALL_IN if they have no chips left after the call
        this.setAllInWhenBalanceIsZero(player);
    }
}

export default CallAction;
