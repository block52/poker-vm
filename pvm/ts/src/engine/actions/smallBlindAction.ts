import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/game";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class SmallBlindAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.SMALL_BLIND }

    verify(_player: Player) : Range {
        super.verify(_player);

        // Can only bet the small blind amount when preflop
        if (this.game.currentRound !== TexasHoldemRound.PREFLOP) {
            throw new Error("Can only bet small blind amount when preflop.");
        }

        return { minAmount: this.game.smallBlind, maxAmount: this.game.smallBlind };
    }

    getDeductAmount(): bigint {
        return this.game.smallBlind;
    }
}

export default SmallBlindAction;