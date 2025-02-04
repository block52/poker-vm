import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { Player, Range } from "../../models/game";
import BaseAction from "./baseAction";

class BigBlindAction extends BaseAction {
    get type(): PlayerActionType {
        return PlayerActionType.BIG_BLIND;
    }

    verify(_player: Player) : Range {
        return { minAmount: this.game.bigBlind, maxAmount: this.game.bigBlind };
    }

    getDeductAmount(): bigint {
        return this.game.bigBlind;
    }
}

export default BigBlindAction;
