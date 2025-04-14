import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class BigBlindAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.BIG_BLIND;
    }

    verify(_player: Player): Range {
        // Can only post big blind during ante or preflop rounds
        if (this.game.currentRound !== TexasHoldemRound.PREFLOP && this.game.currentRound !== TexasHoldemRound.ANTE) {
            throw new Error("Can only post big blind during ante or preflop rounds.");
        }

        // Only the big blind player can post the big blind
        const seat = this.game.getPlayerSeatNumber(_player.address);
        if (seat !== this.game.bigBlindPosition) {
            throw new Error("Only the big blind player can post the big blind.");
        }

        // Check if big blind has already been posted in the current round
        const currentRoundActions = this.game.getActionsForRound(this.game.currentRound);
        const bigBlindAction = currentRoundActions.find(a => a.action === PlayerActionType.BIG_BLIND);
        if (bigBlindAction) {
            throw new Error("Big blind has already been posted.");
        }

        // If we're in ANTE round
        if (this.game.currentRound === TexasHoldemRound.ANTE) {
            // Check if small blind has been posted first (only required in ANTE round)
            const anteActions = this.game.getActionsForRound(this.game.currentRound);
            const smallBlindAction = anteActions.find(a => a.action === PlayerActionType.SMALL_BLIND);
            if (!smallBlindAction) {
                throw new Error("Small blind must be posted before big blind in ANTE round.");
            }
        }
        
        // If we're in PREFLOP round
        if (this.game.currentRound === TexasHoldemRound.PREFLOP) {
            // Check if small blind was posted in ANTE round
            const anteActions = this.game.getActionsForRound(TexasHoldemRound.ANTE);
            const smallBlindAction = anteActions.find(a => a.action === PlayerActionType.SMALL_BLIND);
            if (!smallBlindAction) {
                throw new Error("Small blind must be posted in ANTE round before big blind in PREFLOP.");
            }
        }

        return { minAmount: this.game.bigBlind, maxAmount: this.game.bigBlind };
    }

    getDeductAmount(): bigint {
        return this.game.bigBlind;
    }
}

export default BigBlindAction;
