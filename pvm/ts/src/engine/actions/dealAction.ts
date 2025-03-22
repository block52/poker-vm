import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class DealAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.DEAL;
    }

    verify(_player: Player): Range {
        // Can only bet the big blind amount when preflop
        if (this.game.currentRound !== TexasHoldemRound.PREFLOP) {
            throw new Error("Can only deal when preflop.");
        }

        const count = this.game.getPlayerCount();
        if (count < 2) {
            throw new Error("Not enough players to deal.");
        }

        const actions = this.game.getActionsForRound(TexasHoldemRound.PREFLOP);
        if (actions.length !== 2) {
            throw new Error("Not all players have posted their blinds or action has already started.");
        }

        // Check if small blind has been posted first
        const smallBlindAction = actions.find(a => a.action === PlayerActionType.SMALL_BLIND);
        if (!smallBlindAction) {
            throw new Error("Small blind must be posted before we can deal.");
        }

        // Check if big blind has already been posted
        const bigBlindAction = actions.find(a => a.action === PlayerActionType.BIG_BLIND);
        if (!bigBlindAction) {
            throw new Error("Big blind must be posted before we can deal.");
        }

        return { minAmount: 0n, maxAmount: 0n };
    }
}

export default DealAction;
