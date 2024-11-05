import { ActionType, Player } from "../types";
import BaseAction from "./baseAction";

class BlindAction extends BaseAction {
    get action(): ActionType { return ActionType.BLIND }

    verify(player: Player, amount?: number) {
        if (player.chips < amount!)
            throw new Error("Player has insufficient chips to post blind.");
    }

    execute(player: Player, amount?: number) {
        super.execute(player, amount);
        player.chips -= amount!;
        this.update.addMove({ playerId: player.id, action: ActionType.BLIND, amount });
    }
}

export default BlindAction;