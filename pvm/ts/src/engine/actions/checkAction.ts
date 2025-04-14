import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range, Turn } from "../types";

class CheckAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.CHECK }

    verify(player: Player): Range | undefined {
        // Cannot check in the ANTE round
        if (this.game.currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot check in the ante round.");
        }

        // If in PREFLOP round and this player is the big blind position, they should post the big blind first
        if (this.game.currentRound === TexasHoldemRound.PREFLOP) {
            const seat = this.game.getPlayerSeatNumber(player.address);
            const isBigBlindSeat = seat === this.game.bigBlindPosition;
            
            // Check if big blind has been posted yet
            const preFlopActions = this.game.getActionsForRound(TexasHoldemRound.PREFLOP);
            const hasBigBlindPosted = preFlopActions.some(a => a.action === PlayerActionType.BIG_BLIND);
            
            if (isBigBlindSeat && !hasBigBlindPosted) {
                throw new Error("Big blind player must post big blind first before checking.");
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