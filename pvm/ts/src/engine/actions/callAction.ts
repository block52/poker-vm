import { PlayerAction } from "@bitcoinbrisbane/block52";
import { Player, Range } from "../../models/game";
import BaseAction from "./baseAction";

class CallAction extends BaseAction {
    get type(): PlayerAction { return PlayerAction.CALL }

    verify(player: Player): Range | undefined {
        super.verify(player);
        if (this.game.getMaxStake() == 0)
            throw new Error("A bet must be made before it can be called.")
        if (player.chips < this.getDeductAmount(player))
            throw new Error("Player has insufficient chips to call.");
        return undefined;
    }

    protected getDeductAmount(player: Player, _amount?: number): number {
        return this.game.getMaxStake() - this.game.getPlayerStake(player);
    }
}

export default CallAction;