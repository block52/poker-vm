import { ActionType, Player } from "../types";
import BaseAction from "./baseAction";

class CheckAction extends BaseAction {
    get action(): ActionType { return ActionType.CHECK }

    verify(player: Player) {
        super.verify(player);
        if (this.game.getPlayerStake(player) < this.game.getMaxStake())
            throw new Error("Player has insufficient stake to check.")
    }

    execute(player: Player) {
        super.execute(player);
        this.update.addMove({ playerId: player.id, action: ActionType.CHECK, amount: 0 });
    }
}

export default CheckAction;