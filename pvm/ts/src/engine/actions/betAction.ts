import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";
import { BetManager } from "../managers/betManager";

class BetAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.BET;
    }

    verify(player: Player): Range {
        // Check base conditions (hand active, player's turn, player active)
        super.verify(player);

        // 1. Round state check: Cannot bet during ANTE or SHOWDOWN rounds
        this.validateNotInAnteRound();
        this.validateNotInShowdownRound();

        const currentRound = this.game.currentRound;

        // 2. Bet matching check: Player must match existing bets before betting
        const includeBlinds = currentRound === TexasHoldemRound.PREFLOP;
        const betManager = this.getBetManager(includeBlinds);
        const currentBet: bigint = betManager.getLargestBet();

        if (currentBet > 0n) {
            throw new Error("Cannot bet - player must call or raise.");
        }

        return { minAmount: this.game.bigBlind, maxAmount: player.chips }
    }

    execute(player: Player, index: number, amount: bigint): void {
        // Verify the player can perform the call action
        if (amount <= 0n) {
            throw new Error("Bet amount must be greater than zero.");
        }

        super.execute(player, index, amount);

        // Set player state to ALL_IN if they have no chips left after the bet
        this.setAllInWhenBalanceIsZero(player);
    }
}

export default BetAction;