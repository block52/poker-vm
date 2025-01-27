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

    getDeductAmount(_player: Player, _amount?: BigInt): BigInt {
        return this.game.bigBlind;
    }
}

export default BigBlindAction;
