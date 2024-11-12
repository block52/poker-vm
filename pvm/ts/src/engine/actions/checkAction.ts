import { PlayerAction } from "@bitcoinbrisbane/block52";
import { Player, Range } from "../../models/game";
import BaseAction from "./baseAction";

class CheckAction extends BaseAction {
    get type(): PlayerAction { return PlayerAction.CHECK }

    verify(player: Player): Range | undefined {
        super.verify(player);
        if (this.game.getPlayerStake(player) < this.game.getMaxStake())
            throw new Error("Player has insufficient stake to check.")
        return undefined;
    }
}

export default CheckAction;