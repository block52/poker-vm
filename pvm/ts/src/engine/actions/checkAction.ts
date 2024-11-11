import { ActionType, Player, Range } from "../types";
import BaseAction from "./baseAction";

class CheckAction extends BaseAction {
    get type(): ActionType { return ActionType.CHECK }

    verify(player: Player): Range | undefined {
        super.verify(player);
        if (this.game.getPlayerStake(player) < this.game.getMaxStake())
            throw new Error("Player has insufficient stake to check.")
        return undefined;
    }
}

export default CheckAction;