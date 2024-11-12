import { ActionType, Player } from "../types";
import BaseAction from "./baseAction";

class SmallBlindAction extends BaseAction {
    get type(): ActionType { return ActionType.SMALL_BLIND }

    verify(_player: Player) {
        return undefined; 
    }

    getDeductAmount(_player: Player, _amount?: number): number | undefined {
        return this.game.smallBlind;
    }
}

export default SmallBlindAction;