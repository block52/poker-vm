import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range, Turn } from "../types";

class CheckAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.CHECK }

    verify(player: Player): Range | undefined {

        if (this.game.currentRound === TexasHoldemRound.PREFLOP) {
            const preflopRoundBets = this.game.getBets();

            if (preflopRoundBets.size === 0) {
                throw new Error("Cannot check in the preflop round when there's been no action.");
            }
        }

        // Can never check if you haven't matched the largest bet of the round
        const largestBet = this.getLargestBet();
        const sumBets = this.getSumBets(player.address);

        if (largestBet > sumBets) {
            throw new Error("Player must match the largest bet to check.");
        }

        super.verify(player);
        return undefined
    }

    // Get the largest bet in the current round
    private getLargestBet(): bigint {
        let amount = 0n;
        const roundBets = this.game.getBets(this.game.currentRound);

        roundBets.forEach((bet) => {
            if (bet > amount) {
                amount = bet;
            }
        });

        return amount;
    }

    private getSumBets(playerId: string): bigint {
        let totalBet = 0n;

        const roundBets = this.game.getBets(this.game.currentRound);

        // If the player made a bet in this round, add it to the total
        if (roundBets.has(playerId)) {
            totalBet += roundBets.get(playerId) || 0n;
        }

        return totalBet;
    }
}

export default CheckAction;