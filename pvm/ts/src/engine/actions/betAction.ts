import { ActionType, Player } from "../types";
import BaseAction from "./baseAction";

class BetAction extends BaseAction {
    get type(): ActionType { return ActionType.BET }

    verify(player: Player): number | undefined {
        super.verify(player);
        if (player.chips < this.game.bigBlind)
            throw new Error("Player has insufficient chips to bet.");
        if (this.game.getMaxStake() > 0)
            throw new Error("A bet has already been made.")
        return this.game.bigBlind;
    }
}

export default BetAction;