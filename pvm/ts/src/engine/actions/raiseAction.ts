import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range, Turn } from "../types";
import { BetManager } from "../managers/betManager";

class RaiseAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.RAISE;
    }

    /**
     * Verify if a player can raise and determine the valid raise range
     *
     * For a raise to be valid:
     * 1. Player must be active and it must be their turn (checked in base verify)
     * 2. Game must not be in the ANTE or SHOWDOWN round
     * 3. Player cannot have the largest bet (can't raise yourself)
     * 4. Must raise by at least the big blind amount above the largest bet
     *
     * @param player The player attempting to raise
     * @returns Range object with minimum and maximum raise amounts
     * @throws Error if raising conditions are not met
     */
    verify(player: Player): Range {
        // 1. Perform basic validation (player active, player's turn, etc.)
        super.verify(player);

        // 2. Cannot raise in the ANTE round
        const currentRound = this.game.currentRound;
        if (currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot raise in the ante round. Only small and big blinds are allowed.");
        }

        if (currentRound === TexasHoldemRound.SHOWDOWN) {
            throw new Error("Cannot raise in the showdown round.");
        }

        // 3. Find who has the largest bet for this round
        const includeBlinds = currentRound === TexasHoldemRound.PREFLOP;

        const actions = this.game.getActionsForRound(currentRound);
        let newActions = [...actions];
        if (includeBlinds) {
            const anteActions = this.game.getActionsForRound(TexasHoldemRound.ANTE);
            newActions.push(...anteActions);
        }

        if (newActions.length < 2 && includeBlinds === true || newActions.length === 0 && includeBlinds === false) {
            throw new Error("Cannot raise - no bets have been placed yet.");
        }

        const betManager = new BetManager(newActions);
        const currentBetAmount: bigint = betManager.current();

        if (currentBetAmount === 0n) {
            throw new Error("Cannot raise - no bets have been placed yet.");
        }

        const lastAggressor: bigint = betManager.getLastAggressor();
        const minRaiseToAmount: bigint = currentBetAmount + lastAggressor;

        if (player.chips < minRaiseToAmount) {
            // Player can only go all-in
            return {
                minAmount: player.chips, // Total amount if going all-in
                maxAmount: player.chips
            };
        }

        return {
            minAmount: minRaiseToAmount, // deltaToCall > this.game.bigBlind ? deltaToCall : this.game.bigBlind, // Minimum raise amount
            maxAmount: player.chips // Total possible if going all-in
        };
    }
}

export default RaiseAction;