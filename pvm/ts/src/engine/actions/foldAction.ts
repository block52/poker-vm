import { ActionType, Player } from "../types";
import BaseAction from "./baseAction";

class FoldAction extends BaseAction {
    get action(): ActionType { return ActionType.FOLD }

    verify(player: Player) {
        super.verify(player);
    }

    execute(player: Player) {
        super.execute(player);
        this.update.addMove({ playerId: player.id, action: ActionType.FOLD });
    }
}

export default FoldAction;