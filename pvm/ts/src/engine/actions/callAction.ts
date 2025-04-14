import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class CallAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.CALL }

    verify(player: Player): Range | undefined {
        // Cannot call in the ANTE round
        if (this.game.currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot call in the ante round. Small blind must post.");
        }
        
        // Check if this player should be posting the big blind instead
        const seat = this.game.getPlayerSeatNumber(player.address);
        const isBigBlindSeat = seat === this.game.bigBlindPosition;
        
        // If in PREFLOP and big blind player hasn't posted big blind yet, they should post big blind, not call
        if (this.game.currentRound === TexasHoldemRound.PREFLOP && isBigBlindSeat) {
            // Check if big blind has been posted yet
            const bigBlindPosted = this.game.getActionsForRound(TexasHoldemRound.PREFLOP)
                .some(a => a.action === PlayerActionType.BIG_BLIND);
                
            if (!bigBlindPosted) {
                throw new Error("Big blind player must post big blind before calling.");
            }
        }
        
        const lastAction = this.game.getLastRoundAction();

        if (!lastAction)
            throw new Error("No previous action to call.");

        if (lastAction?.amount === 0n || !lastAction?.amount)
            throw new Error("Should check instead.");

        // Get the sum of my bets in this round.
        let deductAmount: bigint = this.getDeductAmount(player);

        if (deductAmount === 0n)
            throw new Error("Player has already met maximum so can check instead.");

        // Safety check to ensure we never have negative amounts
        if (deductAmount < 0n)
            deductAmount = 0n;

        if (player.chips < deductAmount)
            deductAmount = player.chips;

        return { minAmount: deductAmount, maxAmount: deductAmount };
    }

    execute(player: Player, index: number): void {
        const deductAmount = this.getDeductAmount(player);
        if (deductAmount) {
            if (player.chips < deductAmount)
                throw new Error(`Player has insufficient chips to ${this.type}.`);

            player.chips -= deductAmount;
        }

        const round = this.game.currentRound;
        this.game.addAction({ playerId: player.address, action: !player.chips && deductAmount ? PlayerActionType.ALL_IN : this.type, amount: deductAmount, index: index }, round);
    }

    protected getDeductAmount(player: Player): bigint {
        // First get player's bets across all rounds, not just current round
        // This ensures that bets in ANTE (like small blind) are counted when in PREFLOP
        let totalBetsAllRounds = 0n;
        
        // Get the sum of bets for this player in the ANTE round
        const anteRoundBets = this.game.getPlayerTotalBets(player.address, TexasHoldemRound.ANTE);
        totalBetsAllRounds += anteRoundBets;
        
        // Get the sum of bets for this player in the current round
        const currentRoundBets = this.game.getPlayerTotalBets(player.address, this.game.currentRound);
        totalBetsAllRounds += currentRoundBets;
        
        // Get the largest bet in the current round
        const largestBet = this.getLargestBet();
        
        // If player has already bet the same or more than the largest bet, return 0
        if (totalBetsAllRounds >= largestBet) {
            return 0n;
        }
        
        // Otherwise return the difference needed to call
        return largestBet - totalBetsAllRounds;
    }
}

export default CallAction;