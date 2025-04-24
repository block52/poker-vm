import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range, Turn } from "../types";

class CheckAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.CHECK }

    verify(player: Player): Range | undefined {

        if (this.game.currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot check in the ante round.");
        }

        // Hack for UTG on preflop
        if (this.game.currentRound === TexasHoldemRound.PREFLOP && this.game.getPlayerSeatNumber(player.address) === this.game.bigBlindPosition) {
            // this is valid for the small blind player
            return { minAmount: this.game.bigBlind, maxAmount: this.game.bigBlind };
        }

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
        return { minAmount: 0n, maxAmount: 0n };
    }
}

export default CheckAction;