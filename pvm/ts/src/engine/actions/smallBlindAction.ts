import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/game";
import BaseAction from "./baseAction";
import { Range } from "../types";

class SmallBlindAction extends BaseAction {
    get type(): PlayerActionType { return PlayerActionType.SMALL_BLIND }

    verify(_player: Player) : Range {
        return { minAmount: this.game.smallBlind, maxAmount: this.game.smallBlind };
    }

    getDeductAmount(): bigint {
        return this.game.smallBlind;
    }
}

export default SmallBlindAction;