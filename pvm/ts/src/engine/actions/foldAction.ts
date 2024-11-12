import { ActionType, Player } from "../types";
import BaseAction from "./baseAction";

class FoldAction extends BaseAction {
    get type(): ActionType { return ActionType.FOLD }
}

export default FoldAction;