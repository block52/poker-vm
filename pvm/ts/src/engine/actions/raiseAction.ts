import { PlayerActionType, TexasHoldemRound } from "@block52/poker-vm-sdk";
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

        // 1. Round state check: Cannot raise during ANTE, SHOWDOWN, or END rounds
        this.validateNotInAnteRound();
        this.validateNotInShowdownRound();
        this.validateNotInEndRound();

        const currentRound = this.game.currentRound;

        // 3. Get the bets for the current round
        const includeBlinds = currentRound === TexasHoldemRound.PREFLOP;
        const betManager = this.getBetManager(includeBlinds);
        const currentBet: bigint = betManager.getLargestBet();

        if (currentBet === 0n) {
            throw new Error("Cannot raise - no bets have been placed yet.");
        }

        const playersBet: bigint = betManager.getTotalBetsForPlayer(player.address);

        // 4. Calculate the minimum raise amount for 3-bet/4-bet scenarios
        // Use the actual last raise amount from bet manager
        const lastRaiseAmount: bigint = betManager.getRaisedAmount();

        // Minimum total bet amount after raise
        const minTotalBetAmount: bigint = currentBet + lastRaiseAmount;

        // Convert to additional amount needed  
        const minRaiseAmount: bigint = minTotalBetAmount - playersBet;

        if (player.chips < minRaiseAmount) {
            // Player can't afford minimum raise - they must go all-in instead
            throw new Error("Insufficient chips for minimum raise - use all-in instead.");
        }

        return {
            minAmount: minRaiseAmount,  // Return additional amount needed, not total bet amount
            maxAmount: player.chips
        };
    }

    execute(player: Player, index: number, amount: bigint): void {
        // Re-verify the action is still valid before modifying state
        this.verify(player);

        // Verify the amount is greater than zero
        if (amount <= 0n) {
            throw new Error("Bet amount must be greater than zero.");
        }

        super.execute(player, index, amount);

        // Set player state to ALL_IN if they have no chips left after the bet
        this.setAllInWhenBalanceIsZero(player);
    }
}

export default RaiseAction;