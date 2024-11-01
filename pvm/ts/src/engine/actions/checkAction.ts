import { ActionType, Player } from "../types";
import BaseAction from "./baseAction";

class CheckAction extends BaseAction {
    get action(): ActionType { return ActionType.CHECK }

    verify(player: Player) {
        super.verify(player);
        // !! need to check every time to make sure they are the current player also
        if (this.game.getPlayerStake(player) < this.game.getMaxStake())
            throw new Error("Player has insufficient stake to check.")
    }

    execute(player: Player) {
        super.execute(player);
        this.update.addMove({ playerId: player.id, action: ActionType.BET, amount: 0 });
    }
}

export default CheckAction;