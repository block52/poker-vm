import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { Range } from "../types";

class BetAction extends BaseAction {
    get type(): PlayerActionType {
        return PlayerActionType.BET;
    }

    verify(player: Player): Range | undefined {
        super.verify(player);
        if (player.chips < this.game.bigBlind) {
            return { minAmount: player.chips, maxAmount: player.chips };
        }

        return { minAmount: this.game.bigBlind, maxAmount: player.chips };
    }
}

export default BetAction;
