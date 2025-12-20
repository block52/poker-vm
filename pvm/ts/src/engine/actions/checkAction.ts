import { PlayerActionType, TexasHoldemRound } from "@block52/poker-vm-sdk";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class CheckAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.CHECK;
    }

    verify(player: Player): Range {
        // Basic validation
        super.verify(player);

        // 1. Round state check: Cannot check in the ante, showdown, or end rounds
        this.validateNotInAnteRound();
        this.validateNotInShowdownRound();
        this.validateNotInEndRound();

        const currentRound = this.game.currentRound;

        // 2. Get the bets for the current round
        const includeBlinds = currentRound === TexasHoldemRound.PREFLOP;
        const betManager = this.getBetManager(includeBlinds);
        const currentBetAmount: bigint = betManager.getLargestBet();

        if (currentBetAmount === 0n) {
            return { minAmount: 0n, maxAmount: 0n };
        }

        const playersBet: bigint = betManager.getTotalBetsForPlayer(player.address);
        if (playersBet === currentBetAmount) {
            // Player has already matched the current bet, can check
            return { minAmount: 0n, maxAmount: 0n };
        }

        throw new Error("Player must match the largest bet to check.");
    }

    execute(player: Player, index: number, amount: bigint): void {
        // Re-verify the action is still valid before modifying state
        this.verify(player);

        // Verify the amount is correct for a check
        if (amount !== 0n) {
            throw new Error("Check amount must be zero.");
        }

        super.execute(player, index, amount);
    }
}

export default CheckAction;
