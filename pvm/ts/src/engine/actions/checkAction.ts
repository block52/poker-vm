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
}

export default CheckAction;