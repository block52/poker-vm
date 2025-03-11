import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/game";
import BaseAction from "./baseAction";
import { Range } from "../types";

class BigBlindAction extends BaseAction {
    get type(): PlayerActionType {
        return PlayerActionType.BIG_BLIND;
    }

    verify(_player: Player): Range {
        // Can only bet the big blind amount when preflop
        if (this.game.currentRound !== TexasHoldemRound.PREFLOP) {
            throw new Error("Can only bet small blind amount when preflop.");
        }

        const seat = this.game.getPlayerSeatNumber(_player.address);
        if (seat !== this.game.bigBlindPosition) {
            throw new Error("Only the big blind player can bet the big blind amount.");
        }

        const actions = this.game.getActionsForRound(TexasHoldemRound.PREFLOP);
        // if (actions.length !== 1) {
        //     throw new Error("Big blind player must be the first to act.");
        // }

        // Filter for big blind action
        const bigBlindAction = actions.find(a => a.action === PlayerActionType.BIG_BLIND);
        if (!bigBlindAction) {
            throw new Error("Big blind player must bet the big blind amount.");
        }

        return { minAmount: this.game.bigBlind, maxAmount: this.game.bigBlind };
    }

    getDeductAmount(): bigint {
        return this.game.bigBlind;
    }
}

export default BigBlindAction;
