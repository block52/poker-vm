import { ActionType, Player } from "../types";
import BaseAction from "./baseAction";

class RaiseAction extends BaseAction {
    get type(): ActionType { return ActionType.RAISE }

    verify(player: Player) {
        super.verify(player);
        if (this.game.getMaxStake() == 0)
            throw new Error("A bet must be made before it can be raised.")
        if (player.chips < this.getDeductAmount(player, this.game.bigBlind))
            throw new Error("Player has insufficient chips to raise.");
        return this.game.bigBlind;
    }

    protected getDeductAmount(player: Player, amount?: number): number {
        return this.game.getMaxStake() - this.game.getPlayerStake(player) + amount!;
    }
}

export default RaiseAction;