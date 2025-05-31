import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range, TurnWithSeat } from "../types";

class RaiseAction extends BaseAction implements IAction {

    private readonly roundActions: TurnWithSeat[] = [];

    get type(): PlayerActionType {
        return PlayerActionType.RAISE;
    }

    /**
     * Verify if a player can raise and determine the valid raise range
     * 
     * For a raise to be valid:
     * 1. Player must be active and it must be their turn (checked in base verify)
     * 2. Game must not be in the ANTE round (only small/big blinds allowed)
     * 3. Blinds must be posted before raising is allowed in preflop
     * 4. There must be a previous bet or raise to raise against
     * 
     * The minimum raise amount follows poker rules:
     * - At least double the previous bet OR
     * - At least the previous bet plus the big blind (whichever is larger)
     * 
     * @param player The player attempting to raise
     * @returns Range object with minimum and maximum raise amounts
     * @throws Error if raising conditions are not met
     */
    verify(player: Player): Range {
        // 1. Perform basic validation (player active, player's turn, etc.)
        super.verify(player);
        
        // 2. Cannot raise in the ANTE round
        if (this.game.currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot raise in the ante round. Small blind must post.");
        }

        if (this.game.currentRound === TexasHoldemRound.SHOWDOWN) {
            throw new Error("Cannot raise in the showdown round.");
        }

        // 3. For preflop, ensure blinds have been posted
        if (this.game.currentRound === TexasHoldemRound.PREFLOP) {
            const playerSeat = this.game.getPlayerSeatNumber(player.address);
            const isSmallBlind = playerSeat === this.game.smallBlindPosition;

            if (isSmallBlind) {
                // Can reopen the betting with a minimum of big blind
                return { minAmount: this.game.smallBlind + this.game.bigBlind, maxAmount: player.chips };
            }
        }

        // Cache the actions for the current round
        this.roundActions.length = 0;
        this.game.getActionsForRound(this.game.currentRound).forEach(action => {
            this.roundActions.push(action);
        });

        // 4. Need a previous bet or raise to raise
        const lastBetOrRaise = this.findLastBetOrRaise();
        if (!lastBetOrRaise) {
            throw new Error("No previous bet to raise.");
        }

        // Calculate minimum raise amount
        const playerCurrentBet = this.getSumBets(player.address);
        
        const increment = this.findPreviousBetOrRaise(lastBetOrRaise.index);
        const delta = BigInt(lastBetOrRaise.amount || 0n) - BigInt(increment?.amount || 0n);
        
        if (delta <= 0n) {
            throw new Error("Invalid raise amount. Must be greater than the last bet.");
        }

        let minAmountToAdd = delta - playerCurrentBet;
        
        // If player doesn't have enough for the minimum raise, they can go all-in
        if (player.chips < minAmountToAdd) {
            minAmountToAdd = player.chips;
        }

        return { 
            minAmount: minAmountToAdd, 
            maxAmount: player.chips 
        };
    }

    // Find the last bet or raise in the current round
    private findLastBetOrRaise(): TurnWithSeat | undefined {
        // Filter for bets and raises
        const betOrRaiseActions = this.roundActions.filter(action =>
            action.action === PlayerActionType.BET || action.action === PlayerActionType.RAISE
        );

        return betOrRaiseActions.length > 0 ? betOrRaiseActions[betOrRaiseActions.length - 1] : undefined;
    }

    // Find the last bet or raise in the current round
    private findPreviousBetOrRaise(start: number): TurnWithSeat | undefined {
        // const actions = this.game.getActionsForRound(this.game.currentRound);

        // Filter for bets and raises
        const betOrRaiseActions = this.roundActions.filter(action =>
            action.action === PlayerActionType.BET || action.action === PlayerActionType.RAISE
        );

        // If no actions found, return undefined
        if (betOrRaiseActions.length === 0) return undefined;

        if (start < 0 || start - 1 > betOrRaiseActions.length) {
            return undefined;
        }

        for (let i = start - 1; i >= 0; i--) {
            if (betOrRaiseActions[i].action === PlayerActionType.BET || betOrRaiseActions[i].action === PlayerActionType.RAISE) {
                return betOrRaiseActions[i];
            }
        }
    }

    protected getDeductAmount(player: Player, amount?: bigint): bigint {
        if (!amount) return 0n;

        // Calculate how much more the player needs to add to the pot
        const bets = this.getSumBets(player.address);
        const delta = amount - bets;

        // Return the amount to add (or player's entire stack if they don't have enough)
        return delta > player.chips ? player.chips : delta;
    }
}

export default RaiseAction;
