import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class RaiseAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.RAISE;
    }

    /**
     * Verify if a player can raise and determine the valid raise range
     *
     * For a raise to be valid:
     * 1. Player must be active and it must be their turn (checked in base verify)
     * 2. Game must not be in the ANTE or SHOWDOWN rounds
     * 3. Blinds must be posted before raising is allowed in preflop
     * 4. There must be a previous bet or raise to raise against
     *
     * The minimum raise amount follows poker rules:
     * - At least double the previous bet OR
     * - At least the previous bet plus the big blind (whichever is larger)
     * - If a raise has already been made: min = raiseAmount + (raiseAmount - betAmount)
     *
     * @param player The player attempting to raise
     * @returns Range object with minimum and maximum raise amounts
     * @throws Error if raising conditions are not met
     */
    verify(player: Player): Range {
        // 1. Perform basic validation (player active, player's turn, etc.)
        super.verify(player);

        // 2. Cannot raise in the ANTE or SHOWDOWN rounds
        if (this.game.currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot raise in the ante round. Small blind must post.");
        }
        if (this.game.currentRound === TexasHoldemRound.SHOWDOWN) {
            throw new Error("Cannot raise in the showdown round.");
        }

        // 3. For preflop, allow small blind to reopen at exactly 1BB
        if (this.game.currentRound === TexasHoldemRound.PREFLOP) {
            const seat = this.game.getPlayerSeatNumber(player.address);
            if (seat === this.game.smallBlindPosition) {
                // Small blind re-open: min = 1 BB
                return { minAmount: this.game.bigBlind, maxAmount: player.chips };
            }
        }

        // 4. Determine last bet or raise
        const last = this.findLastBetOrRaise();
        if (!last) {
            // No previous bet: first voluntary raise = 1 BB
            return { minAmount: this.game.bigBlind, maxAmount: player.chips };
        }

        // Destructure action and assert amount exists
        const action = last.action;
        const lastAmount = last.amount!;
        const contributed = this.getSumBets(player.address);

        let targetRaise: bigint;
        if (action === PlayerActionType.BET) {
            // Bet-only: min = 2 × lastBet
            targetRaise = lastAmount * 2n;
        } else {
            // Bet+raise: min = raiseAmount + (raiseAmount – betAmount)
            const previousBetAmount = this.findPreviousBetBeforeRaise()?.amount ?? this.game.bigBlind;
            const diff = lastAmount - previousBetAmount;
            targetRaise = lastAmount + diff;
        }

        // Compute how much more the player needs to add
        let minToAdd = targetRaise - contributed;
        if (minToAdd > player.chips) {
            minToAdd = player.chips;
        }

        return { minAmount: minToAdd, maxAmount: player.chips };
    }

    // Find the last bet or raise in the current round
    private findLastBetOrRaise() {
        const actions = this.game.getActionsForRound(this.game.currentRound);
        for (let i = actions.length - 1; i >= 0; i--) {
            const a = actions[i];
            if (a.action === PlayerActionType.BET || a.action === PlayerActionType.RAISE) {
                return a;
            }
        }
        return undefined;
    }

    // Find the most recent BET before the last RAISE, if any
    private findPreviousBetBeforeRaise() {
        const actions = this.game.getActionsForRound(this.game.currentRound);
        let raiseIndex = -1;
        for (let i = actions.length - 1; i >= 0; i--) {
            if (actions[i].action === PlayerActionType.RAISE) {
                raiseIndex = i;
                break;
            }
        }
        if (raiseIndex <= 0) return undefined;
        for (let i = raiseIndex - 1; i >= 0; i--) {
            if (actions[i].action === PlayerActionType.BET) {
                return actions[i];
            }
        }
        return undefined;
    }

    protected getDeductAmount(player: Player, amount?: bigint): bigint {
        if (!amount) return 0n;
        const current = this.getSumBets(player.address);
        const toAdd = amount - current;
        return toAdd > player.chips ? player.chips : toAdd;
    }
}

export default RaiseAction;
