import { ActionType, Player } from "../types";
import BaseAction from "./baseAction";

class RaiseAction extends BaseAction {
    get action(): ActionType { return ActionType.CALL }

    verify(player: Player, amount?: number) {
        super.verify(player, amount);
        if (this.game.getMaxStake() == 0)
            throw new Error("A bet must be made before it can be raised.")
        const raisePlusCallAmount = this.getRaisePlusCallAmount(player, amount!);
        if (player.chips < raisePlusCallAmount)
            throw new Error("Player has insufficient chips to raise.");
        if (amount! < this.game.bigBlind)
            throw new Error("Raise is not large enough.");
    }

    execute(player: Player, amount?: number) {
        super.verify(player, amount);
        player.chips -= amount!;
        this.update.addMove({ playerId: player.id, action: ActionType.RAISE, amount });
    }

    private getRaisePlusCallAmount(player: Player, amount: number) {
        return this.game.getMaxStake() - this.game.getPlayerStake(player) + amount;
    }

}

export default RaiseAction;