import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { Player, Range } from "../../models/game";
import BaseAction from "./baseAction";

class BetAction extends BaseAction {
    get type(): PlayerActionType {
        return PlayerActionType.BET;
    }

    verify(player: Player): Range | undefined {
        super.verify(player);
        if (player.chips < this.game.bigBlind) {
            return { minAmount: player.chips, maxAmount: player.chips };
        }
        
        // if (this.game.getMaxStake() > 0n) throw new Error("A bet has already been made.");
        
        return { minAmount: this.game.bigBlind, maxAmount: player.chips };
    }
}

export default BetAction;
