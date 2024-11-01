import { ActionType, Player } from "../types";
import BaseAction from "./baseAction";

class BetAction extends BaseAction {
    get action(): ActionType { return ActionType.BET }

    verify(player: Player, amount?: number) {
        super.verify(player);
        if (player.chips < amount!)
            throw new Error("Player has insufficient chips to bet.");
        if (this.game.getMaxStake() > 0)
            throw new Error("A bet has already been made.")
    }

    execute(player: Player, amount?: number) {
        super.execute(player, amount);
        player.chips -= amount!;
        this.update.addMove({ playerId: player.id, action: ActionType.BET, amount });
    }
}

export default BetAction;