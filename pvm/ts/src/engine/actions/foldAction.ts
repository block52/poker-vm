import { PlayerAction } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";

class FoldAction extends BaseAction {
    get type(): PlayerAction { return PlayerAction.FOLD }
}

export default FoldAction;