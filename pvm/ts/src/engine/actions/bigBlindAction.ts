import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/game";
import BaseAction from "./baseAction";

class BigBlindAction extends BaseAction {
    get type(): PlayerActionType {
        return PlayerActionType.BIG_BLIND;
    }

    verify(_player: Player) {
        return undefined;
    }

    getDeductAmount(): bigint {
        return this.game.bigBlind;
    }
}

export default BigBlindAction;
