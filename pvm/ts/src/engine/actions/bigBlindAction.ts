import { ActionType, Player } from "../types";
import BaseAction from "./baseAction";

class BigBlindAction extends BaseAction {
    get type(): ActionType { return ActionType.BIG_BLIND }

    verify(_player: Player) {
        return undefined; 
    }

    getDeductAmount(_player: Player, _amount?: number): number | undefined {
        return this.game.bigBlind;
    }
}

export default BigBlindAction;