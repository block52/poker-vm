import { PlayerActionType, TexasHoldemRound } from "@block52/poker-vm-sdk";
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

        // 1. Round state check: Cannot bet during ANTE, SHOWDOWN, or END rounds
        this.validateNotInAnteRound();
        this.validateNotInShowdownRound();
        this.validateNotInEndRound();

        const currentRound = this.game.currentRound;

        // 2. Bet matching check: Player must match existing bets before betting
        const includeBlinds = currentRound === TexasHoldemRound.PREFLOP;
        const betManager = this.getBetManager(includeBlinds);
        const currentBet: bigint = betManager.getLargestBet();

        if (currentBet > 0n) {
            throw new Error("Cannot bet - player must call or raise.");
        }

        // If player can't afford the minimum bet (big blind), they must go all-in instead
        if (player.chips < this.game.bigBlind) {
            throw new Error("Insufficient chips for minimum bet - use all-in instead.");
        }

        return { minAmount: this.game.bigBlind, maxAmount: player.chips }
    }

    execute(player: Player, index: number, amount: bigint): void {
        // Re-verify the action is still valid before modifying state
        this.verify(player);
        this.validateAmountIsPositive(amount);

        super.execute(player, index, amount);

        // Set player state to ALL_IN if they have no chips left after the bet
        this.setAllInWhenBalanceIsZero(player);
    }
}

export default BetAction;