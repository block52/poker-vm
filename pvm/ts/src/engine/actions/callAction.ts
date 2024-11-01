import { ActionType, Player } from "../types";
import BaseAction from "./baseAction";

class CallAction extends BaseAction {
    get action(): ActionType { return ActionType.CALL }

    verify(player: Player) {
        super.verify(player);
        if (this.game.getMaxStake() == 0)
            throw new Error("A bet must be made before it can be called.")
        if (player.chips < this.getAmount(player))
            throw new Error("Player has insufficient chips to call.");
    }

    execute(player: Player) {
        this.verify(player);
        const amount = this.getAmount(player);
        player.chips -= amount;
        this.update.addMove({ playerId: player.id, action: ActionType.BET, amount });
    }

    private getAmount(player: Player) {
        return this.game.getMaxStake() - this.game.getPlayerStake(player);
    }
}

export default CallAction;