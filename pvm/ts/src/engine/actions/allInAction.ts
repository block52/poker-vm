import { ActionType, Player, Range } from "../types";
import BaseAction from "./baseAction";

class AllInAction extends BaseAction {
    get type(): ActionType { return ActionType.ALL_IN }

    verify(player: Player): Range | undefined {
        super.verify(player);
        if (player.chips == 0) // !! check this as what happens if run out of chips in middle of game
            throw new Error("Player has no chips so can't go all-in.");
        return undefined;
    }

    protected getDeductAmount(player: Player, _amount?: number) {
        return player.chips;
    }
}

export default AllInAction;