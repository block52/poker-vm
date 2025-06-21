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

        let largestBet = 0n;
        let largestBetPlayer = "";

        const activePlayers = this.game.findActivePlayers();
        for (const activePlayer of activePlayers) {
            const playerBet = this.game.getPlayerTotalBets(activePlayer.address, currentRound, includeBlinds);
            if (playerBet > largestBet) {
                largestBet = playerBet;
                largestBetPlayer = activePlayer.address;
            }
        }

        // 4. Cannot raise if I have the largest bet (can't raise myself)
        if (largestBetPlayer === player.address) {

            // Special case for PREFLOP round, and the player is the big blind
            if (currentRound === TexasHoldemRound.PREFLOP && this.game.getPlayerSeatNumber(player.address) === this.game.bigBlindPosition) {
                return {
                    minAmount: this.game.bigBlind, // Must raise by at least big blind
                    maxAmount: player.chips // Can go all-in
                };
            }

            throw new Error("Cannot raise - you already have the largest bet.");
        }

        // 5. Calculate minimum raise amount
        const playerBets = this.game.getPlayerTotalBets(player.address, currentRound, includeBlinds);

        if (largestBet === 0n) {
            throw new Error("Cannot raise - no bets have been placed yet.");
        }

        // Check if player has enough chips for minimum raise
        // Find the last raise size in this round
        const currentBet = this.getLargestBet(includeBlinds);
        const lastRaiseSize = this.getLastRaiseSize(currentRound);
        const minimumRaiseAmount = lastRaiseSize > 0n ? lastRaiseSize : this.game.bigBlind;
        // const deltaToCall = (largestBet + this.game.bigBlind) - playerBets;
        const deltaToCall = currentBet - largestBet + minimumRaiseAmount;

        if (player.chips < deltaToCall) {
            // Player can only go all-in
            return {
                minAmount: playerBets + player.chips, // Total amount if going all-in
                maxAmount: playerBets + player.chips
            };
        }

        return {
            minAmount: deltaToCall,
            maxAmount: player.chips // Total possible if going all-in
        };
    }

    // private getMinimumRaise(playerId: string): bigint {
    //     const currentBet = this.getLargestBet(this.currentRound);
    //     const playerBet = this.getPlayerTotalBets(playerId, this.currentRound);
    //     const amountToCall = currentBet - playerBet;

    //     // Find the last raise size in this round
    //     const lastRaiseSize = this.getLastRaiseSize(this.currentRound);
    //     const minimumRaiseAmount = lastRaiseSize > 0n ? lastRaiseSize : this.bigBlind;

    //     return amountToCall + minimumRaiseAmount;
    // }

    private getLastRaiseSize(round: TexasHoldemRound): bigint {
        const actions = this.game.getActionsForRound(round);
        const betActions = actions.filter(a =>
            a.action === PlayerActionType.BET ||
            a.action === PlayerActionType.RAISE
        );

        if (betActions.length === 0) return 0n;
        if (betActions.length === 1) return betActions[0].amount || 0n;

        // Return the difference between last two betting actions
        const lastAction = betActions[betActions.length - 1];
        const prevAction = betActions[betActions.length - 2];

        return (lastAction.amount || 0n) - (prevAction.amount || 0n);
    }
}

export default RaiseAction;