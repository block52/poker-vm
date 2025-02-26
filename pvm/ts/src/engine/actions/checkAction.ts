import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/game";
import BaseAction from "./baseAction";
import { Range } from "../types";

class CheckAction extends BaseAction {
    get type(): PlayerActionType { return PlayerActionType.CHECK }

    verify(player: Player): Range | undefined {
        super.verify(player);
        return undefined
    }
}

export default CheckAction;