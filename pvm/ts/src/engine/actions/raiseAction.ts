import { ActionType, Player } from "../types";
import BaseAction from "./baseAction";

class RaiseAction extends BaseAction {
    get action(): ActionType { return ActionType.CALL }

    verify(player: Player, amount?: number) { // !! is amount here just that over the max or includes the difference
        super.verify(player, amount);
        if (this.game.getMaxStake() == 0)
            throw new Error("A bet must be made before it can be raised.")
        if (player.chips < amount!)
            throw new Error("Player has insufficient chips to raise.");
        if ((amount! + this.game.getPlayerStake(player)) < (this.game.getMaxStake() + this.game.bigBlind))
            throw new Error("Raise is not large enough.");
    }

    execute(player: Player, amount?: number) {
        super.verify(player, amount);
        player.chips -= amount!;
        this.update.addMove({ playerId: player.id, action: ActionType.BET, amount });
    }
}

export default RaiseAction;