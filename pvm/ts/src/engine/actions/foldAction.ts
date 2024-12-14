import { PlayerActionType } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";

class FoldAction extends BaseAction {
    get type(): PlayerActionType { return PlayerActionType.FOLD }
}

export default FoldAction;