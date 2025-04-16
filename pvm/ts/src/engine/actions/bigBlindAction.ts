import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class BigBlindAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.BIG_BLIND;
    }

    verify(_player: Player): Range {
        // Can only bet the big blind amount when preflop
        if (this.game.currentRound !== TexasHoldemRound.PREFLOP) {
            throw new Error("Can only post big blind when preflop.");
        }

        const seat = this.game.getPlayerSeatNumber(_player.address);
        if (seat !== this.game.bigBlindPosition) {
            throw new Error("Only the big blind player can post the big blind.");
        }

        const actions = this.game.getActionsForRound(TexasHoldemRound.PREFLOP);

        // Check if small blind has been posted first
        const smallBlindAction = actions.find(a => a.action === PlayerActionType.SMALL_BLIND);
        if (!smallBlindAction) {
            throw new Error("Small blind must be posted before big blind.");
        }

        // Check if big blind has already been posted
        const bigBlindAction = actions.find(a => a.action === PlayerActionType.BIG_BLIND);
        if (bigBlindAction) {
            throw new Error("Big blind has already been posted.");
        }

        return { minAmount: this.game.bigBlind, maxAmount: this.game.bigBlind };
    }

    getDeductAmount(): bigint {
        return this.game.bigBlind;
    }
}

export default BigBlindAction;
