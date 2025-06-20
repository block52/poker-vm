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

        // 3. Use new betting tracking logic for minimum raise calculation
        const currentBet = this.game.currentBet;
        const lastRaiseAmount = this.game.lastRaiseAmount;
        const minRaiseTo = this.game.getMinRaiseTo();
        
        // 4. Find who has the largest bet for this round to prevent self-raising
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
        
        // 5. Cannot raise if I have the largest bet (can't raise myself)
        if (largestBetPlayer === player.address) {
            // Special case for PREFLOP round, and the player is the big blind
            if (currentRound === TexasHoldemRound.PREFLOP && this.game.getPlayerSeatNumber(player.address) === this.game.bigBlindPosition) {
                // Use minimum raise calculation or big blind, whichever is larger
                const minRaise = Math.max(Number(minRaiseTo), Number(this.game.bigBlind));
                return {
                    minAmount: BigInt(minRaise), 
                    maxAmount: player.chips // Can go all-in
                };
            }

            throw new Error("Cannot raise - you already have the largest bet.");
        }
        
        // 6. Calculate minimum raise amount using new betting tracking
        const playerBets = this.game.getPlayerTotalBets(player.address, currentRound, includeBlinds);

        if (currentBet === 0n) {
            // If no bets yet, minimum raise is the big blind
            return {
                minAmount: this.game.bigBlind,
                maxAmount: player.chips
            };
        }
        
        // Use the new minimum raise calculation
        const deltaToCall = minRaiseTo - playerBets;
        
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
}

export default RaiseAction;