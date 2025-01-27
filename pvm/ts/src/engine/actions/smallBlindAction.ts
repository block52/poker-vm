import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/game";
import BaseAction from "./baseAction";

class SmallBlindAction extends BaseAction {
    get type(): PlayerActionType { return PlayerActionType.SMALL_BLIND }

    verify(_player: Player) {
        return undefined; 
    }

    getDeductAmount(_player: Player, _amount?: BigInt): BigInt {
        return this.game.smallBlind;
    }
}

export default SmallBlindAction;