import { PlayerAction } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/game";
import BaseAction from "./baseAction";

class SmallBlindAction extends BaseAction {
    get type(): PlayerAction { return PlayerAction.SMALL_BLIND }

    verify(_player: Player) {
        return undefined; 
    }

    getDeductAmount(_player: Player, _amount?: number): number | undefined {
        return this.game.smallBlind;
    }
}

export default SmallBlindAction;