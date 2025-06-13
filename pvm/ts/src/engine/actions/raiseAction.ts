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
        if (this.game.currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot raise in the ante round. Only small and big blinds are allowed.");
        }

        if (this.game.currentRound === TexasHoldemRound.SHOWDOWN) {
            throw new Error("Cannot raise in the showdown round.");
        }

        // 3. Find who has the largest bet for this round
        const currentRound = this.game.currentRound;
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
            throw new Error("Cannot raise - you already have the largest bet.");
        }
        
        // 5. Calculate minimum raise amount
        const myCurrentBet = this.game.getPlayerTotalBets(player.address, currentRound, includeBlinds);
        const deltaToCall = largestBet - myCurrentBet;
        const minTotalBet = largestBet + this.game.bigBlind;
        
        // Check if player has enough chips for minimum raise
        const additionalNeeded = minTotalBet - myCurrentBet;
        
        if (player.chips < additionalNeeded) {
            // Player can only go all-in
            return {
                minAmount: myCurrentBet + player.chips, // Total amount if going all-in
                maxAmount: myCurrentBet + player.chips
            };
        }

        return {
            minAmount: minTotalBet,
            maxAmount: myCurrentBet + player.chips // Total possible if going all-in
        };
    }

    protected getDeductAmount(player: Player, amount?: bigint): bigint {
        if (!amount) return 0n;

        // Calculate how much more the player needs to add to the pot
        const currentRound = this.game.currentRound;
        const includeBlinds = currentRound === TexasHoldemRound.PREFLOP;
        const currentBets = this.game.getPlayerTotalBets(player.address, currentRound, includeBlinds);
        const delta = amount - currentBets;

        // Return the amount to add (or player's entire stack if they don't have enough)
        return delta > player.chips ? player.chips : delta;
    }
}

export default RaiseAction;