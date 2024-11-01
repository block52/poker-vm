import { ActionType, Player } from "../types";
import BaseAction from "./baseAction";

class AllInAction extends BaseAction {
    get action(): ActionType { return ActionType.ALL_IN }

    verify(player: Player) {
        super.verify(player);
        if (player.chips == 0) // !! check this as what happens if run out of chips in middle of game
            throw new Error("Player has no chips so can't go all-in.")
    }

    execute(player: Player) {
        super.execute(player);
        this.update.addMove({ playerId: player.id, action: ActionType.ALL_IN, amount: player.chips });
        player.chips = 0;
    }
}

export default AllInAction;